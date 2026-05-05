"""
File upload utilities for KYC documents and selfies
"""
from fastapi import UploadFile, HTTPException
from pathlib import Path
import uuid
import shutil
from typing import Optional

# Upload directory
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check content type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    # Check file extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"File type {ext} not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}")

def save_upload_file(file: UploadFile, prefix: str = "") -> str:
    """
    Save uploaded file and return the file path
    
    Args:
        file: The uploaded file
        prefix: Optional prefix for filename (e.g., 'document_', 'selfie_')
    
    Returns:
        Relative path to saved file
    """
    # Validate file
    validate_image_file(file)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower() if file.filename else '.jpg'
    filename = f"{prefix}{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    # Return relative path
    return f"/uploads/{filename}"

def delete_upload_file(file_path: str) -> bool:
    """Delete an uploaded file"""
    try:
        full_path = Path(file_path.lstrip('/'))
        if full_path.exists() and full_path.is_relative_to(UPLOAD_DIR):
            full_path.unlink()
            return True
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
    return False
