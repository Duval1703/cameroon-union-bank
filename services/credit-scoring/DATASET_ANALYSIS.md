# 📊 Credit Scoring Dataset Analysis

## Dataset Information

**File:** `PS_20174392719_1491204439457_log.csv`  
**Size:** 471 MB  
**Total Rows:** 6,362,620 transactions  
**Source:** PaySim Mobile Money Simulator  

---

## 📋 Dataset Structure

| Column | Type | Description |
|--------|------|-------------|
| **step** | int | Time step (1 hour = 1 step) |
| **type** | str | Transaction type (PAYMENT, TRANSFER, CASH_OUT, DEBIT, CASH_IN) |
| **amount** | float | Transaction amount |
| **nameOrig** | str | Customer ID who initiated transaction |
| **oldbalanceOrg** | float | Balance before transaction (sender) |
| **newbalanceOrig** | float | Balance after transaction (sender) |
| **nameDest** | str | Recipient ID |
| **oldbalanceDest** | float | Balance before transaction (recipient) |
| **newbalanceDest** | float | Balance after transaction (recipient) |
| **isFraud** | int | 1 = Fraudulent, 0 = Legitimate |
| **isFlaggedFraud** | int | 1 = Flagged by system |

---

## 🎯 Dataset Characteristics

### Transaction Types:
- PAYMENT
- TRANSFER  
- CASH_OUT
- DEBIT
- CASH_IN

### Fraud Distribution:
- **Fraudulent:** ~0.13% of transactions
- **Legitimate:** ~99.87% of transactions
- **Class Imbalance:** High (need to handle in modeling)

### Key Features:
- ✅ Transaction history over time
- ✅ Balance tracking (before/after)
- ✅ Transaction types and amounts
- ✅ Sender/recipient information
- ✅ Fraud labels (supervised learning)

---

## 🔗 Relevance to CUB Platform

This dataset is **PERFECT** for our credit scoring system because:

1. **Mobile Money Transactions** - Similar to MTN/Orange Money
2. **Balance History** - Shows financial behavior
3. **Transaction Patterns** - Can identify responsible users
4. **Fraud Labels** - Can train fraud detection too!

---

## 🚀 Next Steps for Phase 2

### Proposed Approach:

1. **Feature Engineering**
   - Extract user-level features from transactions
   - Calculate financial behavior metrics
   - Create credit-worthy indicators

2. **Credit Score Model**
   - Train ML model to predict creditworthiness
   - Use XGBoost or Random Forest
   - Generate scores 0-1000

3. **Integration with CUB**
   - Connect to data collection agent output
   - Process collected transactions
   - Generate credit scores for users

4. **Explainable AI**
   - Use SHAP values to explain scores
   - Show why a score was assigned
   - Transparent for users

---

## 💡 Credit Scoring Features We Can Create

From this transaction data:

**Income Indicators:**
- Total amount received
- Frequency of incoming payments
- Average incoming transaction size

**Spending Behavior:**
- Total amount sent
- Spending categories (types)
- Cash-out frequency

**Financial Stability:**
- Average balance maintained
- Balance volatility
- Minimum balance over time

**Transaction Patterns:**
- Transaction frequency
- Time-based patterns
- Consistency over time

**Risk Indicators:**
- Large unusual transactions
- Rapid balance changes
- Fraud-like patterns

---

## 📊 Preliminary Statistics

- **Total Transactions:** 6.36 million
- **Unique Users:** ~500,000+
- **Time Period:** Multiple months
- **Transaction Amount Range:** $0 to $10,000,000+
- **Data Quality:** Complete (no missing values)

---

This dataset provides an excellent foundation for building the Credit Scoring AI Agent!
