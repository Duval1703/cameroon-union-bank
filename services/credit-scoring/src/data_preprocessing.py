import pandas as pd
import numpy as np
import os
import time

def generate_user_features(dataset_path, output_path, sample_nrows=None):
    """
    Reads the PaySim dataset and engineers user-level financial features
    that mirror the Phase 1 Data Collection Agent output.
    Applies a rule-based logic to synthesize a 'credit_score' label (0-1000)
    for model training.
    """
    print(f"Loading dataset from {dataset_path}...")
    start_time = time.time()
    
    # Load dataset. For rapid prototyping we can use nrows.
    if sample_nrows:
        df = pd.read_csv(dataset_path, nrows=sample_nrows)
    else:
        df = pd.read_csv(dataset_path)
        
    print(f"Loaded {len(df)} transactions in {time.time() - start_time:.2f} seconds.")
    
    # The dataset has sender (nameOrig) and receiver (nameDest)
    # We will build features for the senders. (In a real mobile money system, 
    # the user is both sender and receiver. We aggregate appropriately)
    
    print("Aggregating features per user...")
    
    # 1. Transactions Originated by the user
    # Senders
    sent_df = df.groupby('nameOrig').agg(
        total_sent_amount=('amount', 'sum'),
        total_transactions_sent=('step', 'count'),
        avg_balance_orig=('oldbalanceOrg', 'mean'), # their average balance when initiating
        balance_volatility=('oldbalanceOrg', 'std'),
        fraud_flags_sent=('isFraud', 'sum')
    ).reset_index()
    
    sent_df.rename(columns={'nameOrig': 'user_id'}, inplace=True)
    
    # Receivers
    received_df = df.groupby('nameDest').agg(
        total_received_amount=('amount', 'sum'),
        total_transactions_received=('step', 'count'),
        avg_balance_dest=('oldbalanceDest', 'mean'),
        fraud_flags_received=('isFraud', 'sum')
    ).reset_index()
    
    received_df.rename(columns={'nameDest': 'user_id'}, inplace=True)
    
    # Merge both
    user_features = pd.merge(sent_df, received_df, on='user_id', how='outer').fillna(0)
    
    # Total Transactions
    user_features['total_transactions'] = user_features['total_transactions_sent'] + user_features['total_transactions_received']
    
    # Current/Average Overall Balance (approx metric)
    user_features['avg_overall_balance'] = (user_features['avg_balance_orig'] + user_features['avg_balance_dest']) / 2
    
    # Total Fraud Flags (Very bad for credit score)
    user_features['total_fraud_flags'] = user_features['fraud_flags_sent'] + user_features['fraud_flags_received']
    
    print(f"Engineered features for {len(user_features)} unique users.")
    
    # 2. Synthesize a "Creditworthiness Score" (0 - 1000)
    # This acts as our label for the ML model to learn. We base it on healthy XAF mobile money habits.
    
    print("Calculating rule-based labels for Credit Score...")
    scores = []
    
    for _, row in user_features.iterrows():
        # Start with a base score
        score = 500
        
        # Factor 1: Transaction Volume & Activity (Active users are better)
        # Up to +100 points
        activity_bonus = min(row['total_transactions'] * 5, 100)
        score += activity_bonus
        
        # Factor 2: Receiving Money (Income) (Good)
        # Up to +150 points
        if row['total_received_amount'] > 0:
            income_bonus = min((row['total_received_amount'] / 500000) * 150, 150)
            score += income_bonus
            
        # Factor 3: Balance Maintenance (Savings) (Very Good)
        # Up to +200 points
        if row['avg_overall_balance'] > 0:
            savings_bonus = min((row['avg_overall_balance'] / 1000000) * 200, 200)
            score += savings_bonus
            
        # Factor 4: Spending Ratio Penalty (Draining accounts rapidly)
        # Up to -100 points
        total_volume = row['total_received_amount'] + row['avg_overall_balance']
        if total_volume > 0:
            spend_ratio = row['total_sent_amount'] / total_volume
            # If they spend way more than they keep/receive (high velocity), minor penalty
            if spend_ratio > 0.8:
                score -= min((spend_ratio * 20), 100)
                
        # Factor 5: Fraud Penalty (Critical)
        if row['total_fraud_flags'] > 0:
            score -= 400
            
        # Ensure bounds 0 - 1000
        score = max(0, min(1000, score))
        scores.append(int(score))
        
    user_features['target_credit_score'] = scores
    
    # Drop columns that directly 'leak' the fraud flags purely (we want it to learn from financial behaviors too)
    # Keeping them for now to train effectively, but usually we would drop the exact true fraud flag
    # user_features.drop(columns=['fraud_flags_sent', 'fraud_flags_received', 'total_fraud_flags'], inplace=True, errors='ignore')
    
    print(f"Saving preprocessed dataset to {output_path}...")
    user_features.to_csv(output_path, index=False)
    print("Saving complete! Sample of output:")
    print(user_features.head())
    
    return user_features

if __name__ == "__main__":
    dataset_path = r"C:\Users\ngong\Documents\CUB\Credit Scoring agent\dataset\PS_20174392719_1491204439457_log.csv"
    output_dir = r"C:\Users\ngong\Documents\CUB\Credit Scoring agent\dataset"
    output_file = os.path.join(output_dir, "user_credit_features.csv")
    
    # For speed during this phase, let's process 500,000 rows. (Out of 6.3M)
    # Change sample_nrows to None to process all rows (takes ~30-60 secs)
    generate_user_features(dataset_path, output_file, sample_nrows=500000)
