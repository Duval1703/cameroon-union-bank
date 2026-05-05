import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import shap

def train_and_save_model(data_path, model_dir):
    """
    Trains a Random Forest Regressor to predict the target_credit_score.
    Saves the model and the SHAP explainer for future use by the API.
    """
    print(f"Loading engineered dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Drop rows without a score just in case, though all should have one.
    df = df.dropna(subset=['target_credit_score'])
    
    # Define features and target.
    # Exclude user_id, direct fraud flags, and the target itself from features.
    exclude_cols = ['user_id', 'target_credit_score', 'fraud_flags_sent', 'fraud_flags_received', 'total_fraud_flags']
    feature_cols = [col for col in df.columns if col not in exclude_cols]
    
    X = df[feature_cols]
    y = df['target_credit_score']
    
    print(f"Selected {len(feature_cols)} features for model training: {feature_cols}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Dataset split: {len(X_train)} training rows, {len(X_test)} testing rows.")
    
    # Initialize Model
    # Random Forest is powerful and provides easy to interpret feature importance
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    
    # Fit the model
    model.fit(X_train, y_train)
    
    # Metrics
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    print("\n--- Model Evaluation ---")
    print(f"R-squared Score: {r2:.4f} (Closer to 1 is better)")
    print(f"Mean Absolute Error: {mae:.2f} points")
    print(f"Mean Squared Error: {mse:.2f}")
    
    print("\n--- Feature Importance (Built-in) ---")
    importances = model.feature_importances_
    for i, v in enumerate(importances):
        print(f"Feature: {feature_cols[i]}, Score: {v:.4f}")
        
    print("\nSetting up SHAP Explainer...")
    # Initialize the SHAP explainer object with the trained model
    # We use a TreeExplainer for Random Forest
    explainer = shap.TreeExplainer(model)
    
    # Save the model
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'credit_scoring_model.pkl')
    explainer_path = os.path.join(model_dir, 'shap_explainer.pkl')
    features_path = os.path.join(model_dir, 'model_features.json')
    
    print(f"Saving artifacts to {model_dir}...")
    joblib.dump(model, model_path)
    # SHAP explainers can be tricky to pickle directly, but TreeExplainer works if we don't save the data.
    joblib.dump(explainer, explainer_path)
    
    # Save the feature names so the API knows what order to feed them
    import json
    with open(features_path, 'w') as f:
        json.dump(feature_cols, f)
        
    print(f"Model saved to: {model_path}")
    print(f"Explainer saved to: {explainer_path}")
    print("Training phase complete! 🚀")

if __name__ == "__main__":
    dataset_path = r"C:\Users\ngong\Documents\CUB\Credit Scoring agent\dataset\user_credit_features.csv"
    model_export_dir = r"C:\Users\ngong\Documents\CUB\Credit Scoring agent\models"
    
    train_and_save_model(dataset_path, model_export_dir)
