import base64
import os
import tempfile
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from paddleocr import PaddleOCR

try:
    from paddleocr import PPStructure
except Exception:  # PPStructure availability varies by PaddleOCR release.
    PPStructure = None


API_KEY = os.getenv("OCR_API_KEY", "")

app = FastAPI(title="MboaTrust Inventory OCR Service")

text_ocr = PaddleOCR(use_angle_cls=True, lang="en")
table_engine = None
table_engine_error: Optional[str] = None

if PPStructure is not None:
    try:
        table_engine = PPStructure(
            layout=False,
            show_log=False,
            return_ocr_result_in_table=True,
            lang="en",
        )
    except Exception as exc:
        table_engine_error = f"{type(exc).__name__}: {exc}"
else:
    table_engine_error = "PPStructure is not available in this PaddleOCR installation."


class OCRRequest(BaseModel):
    image_base64: str
    filename: str = "inventory.jpg"


def require_key(x_api_key: str) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid OCR API key")


def decode_image(payload: OCRRequest) -> str:
    try:
        image_bytes = base64.b64decode(payload.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    suffix = os.path.splitext(payload.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(image_bytes)
        return temp_file.name


def run_text_ocr(image_path: str) -> Dict[str, Any]:
    result = text_ocr.ocr(image_path, cls=True)
    lines: List[str] = []
    entries: List[Dict[str, Any]] = []

    for page in result or []:
        for item in page or []:
            box = item[0]
            text = str(item[1][0]).strip()
            confidence = float(item[1][1])
            if not text:
                continue
            lines.append(text)
            entries.append({
                "text": text,
                "confidence": confidence,
                "box": box,
            })

    return {"lines": lines, "entries": entries}


def clean_cell(value: Any) -> str:
    return str(value or "").replace("\n", " ").strip()


def parse_html_table(html: str) -> Optional[Dict[str, Any]]:
    if not html:
        return None

    try:
        import pandas as pd

        tables = pd.read_html(html)
        if not tables:
            return None

        dataframe = tables[0].fillna("")
        if all(str(column).isdigit() for column in dataframe.columns) and len(dataframe.index) > 1:
            dataframe.columns = [clean_cell(value) or f"Column {index + 1}" for index, value in enumerate(dataframe.iloc[0].tolist())]
            dataframe = dataframe.iloc[1:].reset_index(drop=True)

        columns = [clean_cell(column) or f"Column {index + 1}" for index, column in enumerate(dataframe.columns)]
        rows = [
            {columns[index]: clean_cell(value) for index, value in enumerate(record)}
            for record in dataframe.astype(str).values.tolist()
        ]
        rows = [row for row in rows if any(value for value in row.values())]
        if not columns or not rows:
            return None

        return {
            "columns": columns,
            "rows": rows,
            "confidence": 85,
            "source": "ppstructure_html",
        }
    except Exception:
        return None


def run_table_ocr(image_path: str) -> Optional[Dict[str, Any]]:
    if table_engine is None:
        return None

    try:
        result = table_engine(image_path)
    except Exception:
        return None

    for block in result or []:
        if not isinstance(block, dict):
            continue
        if block.get("type") != "table":
            continue
        table_result = block.get("res") or {}
        if isinstance(table_result, dict):
            structured_table = parse_html_table(str(table_result.get("html") or ""))
            if structured_table:
                return structured_table

    return None


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "engine": "paddleocr",
        "text_model_loaded": True,
        "table_model_loaded": table_engine is not None,
        "table_model_error": table_engine_error,
    }


@app.post("/ocr/inventory")
def inventory_ocr(payload: OCRRequest, x_api_key: str = Header(default="")):
    require_key(x_api_key)
    image_path = decode_image(payload)

    try:
        text_result = run_text_ocr(image_path)
        structured_table = run_table_ocr(image_path)

        return {
            "available": True,
            "engine": "paddleocr-ppstructure" if structured_table else "paddleocr",
            "lines": text_result["lines"],
            "entries": text_result["entries"],
            "structured_table": structured_table,
            "error": None if structured_table else table_engine_error,
        }
    finally:
        try:
            os.remove(image_path)
        except Exception:
            pass
