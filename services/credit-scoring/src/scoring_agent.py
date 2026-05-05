import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import joblib
import json
import os
import shap

app = FastAPI(title="CUB Credit Scoring API", version="1.0", description="Phase 2 AI Scoring Agent")

# Define Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "credit_scoring_model.pkl")
EXPLAINER_PATH = os.path.join(MODEL_DIR, "shap_explainer.pkl")
FEATURES_PATH = os.path.join(MODEL_DIR, "model_features.json")

# Load Models
try:
    model = joblib.load(MODEL_PATH)
    explainer = joblib.load(EXPLAINER_PATH)
    with open(FEATURES_PATH, "r") as f:
        feature_cols = json.load(f)
    print("✅ Model and Explainer loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading model files: {e}")
    model, explainer, feature_cols = None, None, []

# Input Payload Schema matching Phase 1 output
class TransactionSummary(BaseModel):
    total_transactions: int
    total_received: float
    total_sent: float
    current_balance: float

class Phase1Data(BaseModel):
    provider: str
    user_phone: str
    data_period: str
    summary: TransactionSummary
    transactions: List[Dict[str, Any]]

class ScoreRequest(BaseModel):
    request_id: str
    data: Phase1Data

@app.get("/")
def root():
    return {"status": "operational", "service": "Credit Scoring AI Agent"}

@app.post("/score-user")
def score_user(payload: ScoreRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Credit model not loaded. Please train the model first.")
        
    try:
        # Extract Phase 1 summary
        summary = payload.data.summary
        
        # We need to map the incoming data to the model's expected features
        # The exact required features: 
        # ["total_sent_amount", "total_transactions_sent", "avg_balance_orig", "balance_volatility", 
        #  "total_received_amount", "total_transactions_received", "avg_balance_dest", "total_transactions", "avg_overall_balance"]
        
        # Map approximations from the live API data summary:
        mapped_features = {
            "total_sent_amount": summary.total_sent,
            "total_transactions_sent": summary.total_transactions // 2, # Approximation if we don't iterate transactions directly
            "avg_balance_orig": summary.current_balance,
            "balance_volatility": 0.0, # Not easily captured in pure summary without tracking std dev
            "total_received_amount": summary.total_received,
            "total_transactions_received": summary.total_transactions // 2,
            "avg_balance_dest": summary.current_balance,
            "total_transactions": summary.total_transactions,
            "avg_overall_balance": summary.current_balance
        }
        
        # Build DataFrame maintaining strict column order
        input_df = pd.DataFrame([mapped_features], columns=feature_cols)
        
        # Predict the numerical credit score
        predicted_score = model.predict(input_df)[0]
        
        # Bounds check (0-1000)
        final_score = int(np.clip(predicted_score, 0, 1000))
        
        # Determine human-readable Tier
        if final_score >= 800:
            tier = "Excellent"
        elif final_score >= 700:
            tier = "Good"
        elif final_score >= 600:
            tier = "Fair"
        else:
            tier = "Poor (High Risk)"
            
        # Get SHAP Explanation
        shap_values = explainer.shap_values(input_df)
        
        # SHAP returns a matrix. For a single row, we unpack it.
        if isinstance(shap_values, list):
             sv = shap_values[0][0]
        else:
             sv = shap_values[0]
             
        # Create a list of top contributing factors
        explanations = []
        for feature_name, shap_impact in zip(feature_cols, sv):
            if abs(shap_impact) > 1.0: # Only list significant factors
                direction = "increased" if shap_impact > 0 else "decreased"
                explanations.append({
                    "feature": feature_name,
                    "impact": float(shap_impact),
                    "human_readable": f"This user's {feature_name} {direction} their score by {abs(shap_impact):.1f} points."
                })
                
        # Sort explanations by highest impact (absolute value)
        explanations.sort(key=lambda x: abs(x['impact']), reverse=True)
        
        # Construct final JSON response
        return {
            "success": True,
            "request_id": payload.request_id,
            "user_phone": payload.data.user_phone,
            "credit_score": final_score,
            "rating_tier": tier,
            "explanations": explanations[:4] # Return top 4 reasons
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting CUB Credit Scoring API...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
