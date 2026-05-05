# Credit Scoring Model Specification
# MboaTrust AI

**Version:** 1.0
**Date:** 2026-04-06

---

## 1. Overview

The MboaTrust Trust Score is a **0–100 numerical score** representing a Cameroonian merchant's financial reliability and business health. It serves as a digital financial identity for merchants who have no formal credit history, enabling access to microloans from partner MFIs (Microfinance Institutions).

The score is:
- Calculated from 6 weighted factor categories
- Updated in real time when new verified data is added
- Explainable — every score has a human-readable breakdown
- Progressive — new merchants start building their score from day one, with weights redistributed across available data as sparse categories fill in

---

## 2. Score Tiers

| Tier | Score Range | Meaning |
|---|---|---|
| Starter | 0 – 30 | New merchant, insufficient data |
| Bronze | 31 – 50 | Basic activity established |
| Silver | 51 – 69 | Consistent records, partial KYC |
| Gold | 70 – 84 | Strong business activity, verified identity |
| Elite | 85 – 100 | Top tier — full KYC, verified receipts, loan history |

Loan eligibility unlocks at **Gold (70+)**.

---

## 3. Factor Categories & Weights

### Category 1 — Business Activity & Revenue (25%)

Measures the health and consistency of the merchant's business operations.

| Factor | How Collected | Weight within Category |
|---|---|---|
| Total monthly sales volume | Add Sale records | High |
| Sales consistency (regularity over time) | Timestamps on sale records | High |
| Revenue growth rate (month-over-month) | Derived from sales history | Medium |
| Average transaction value | Derived from sales records | Medium |
| Transaction frequency per week | Derived from sale timestamps | Medium |
| Number of unique customers tagged | Customer Tag field on Add Sale | Low |

**App coverage:** ✅ Fully covered by existing Sales records.
**Gap:** Unique customer tracking requires the new optional Customer Tag field on Add Sale.

---

### Category 2 — Purchase & Receipt Verification (20%)

Measures the supply side of the business — a merchant who regularly and verifiably restocks has a provably active business. This is the core new feature (REVISED 2026-04-06).

| Factor | How Collected | Weight within Category |
|---|---|---|
| Number of verified purchase receipts | Receipt Verification feature | High |
| Total verified purchase amount | Extracted by OCR from receipts | High |
| Receipt authenticity rate (verified/submitted) | System-computed | High |
| Supplier diversity (number of unique suppliers) | Supplier Name field on Add Stock | Medium |
| Purchase-to-sales ratio consistency | Cross-check stock vs sales records | Medium |
| Manual entry receipts (lower weight) | Manual Entry in Verification Hub | Low |

**App coverage:** 🔄 Being revised — new receipt upload flow replaces old customer payment verification.
**Gap:** Supplier Name field must be added to Add Stock Purchase screen.

---

### Category 3 — Expense & Cash Flow Management (15%)

Measures financial discipline. A merchant who manages expenses relative to income is a lower credit risk.

| Factor | How Collected | Weight within Category |
|---|---|---|
| Expense-to-revenue ratio | Derived from expenses + sales | High |
| Cash flow stability (net per month) | Derived from all records | High |
| Expense growth rate | Derived from expense history | Medium |
| Expense category distribution | Add Expense category field | Medium |
| Consistency of expense recording | Timestamps on expense records | Low |

**App coverage:** ✅ Fully covered by existing Expense records and Financial Summary.

---

### Category 4 — App Behavior Signals (15%)

How a merchant uses the app is itself a trust signal. Consistent, honest record-keepers have lower default risk than merchants who log records sporadically or only when seeking a loan.

| Factor | How Collected | Weight within Category |
|---|---|---|
| Days active in last 30 days | Backend login tracking | High |
| Record logging regularity | Time distribution of records | High |
| Profile completeness % | Derived from profile fields filled | Medium |
| Feature adoption score | Count of distinct features used | Medium |
| Data consistency score | AI cross-check: do records contradict each other? | High |

**App coverage:** ⚠️ These signals are all derivable from backend data but require explicit tracking implementation. No current UI needed — purely backend.

---

### Category 5 — Identity & KYC (15%)

Establishes that the merchant is a real, legitimate, stable individual.

| Factor | How Collected | Weight within Category |
|---|---|---|
| Phone number verified (OTP) | Registration OTP screen | High |
| National ID verified | KYC: National ID Upload screen (new) | High |
| Business registration (RCCM) verified | KYC: RCCM Upload screen (new) | Medium |
| Account age (days since registration) | Derived from created_at | Medium |
| Business category declared | Registration form | Low |
| Name consistency (ID name vs registration name) | AI cross-check via OCR | High |

**App coverage:** ⚠️ Partial. Phone OTP and basic profile exist. National ID upload and RCCM upload are new screens required.

---

### Category 6 — Loan Repayment History (10%)

The most powerful traditional credit signal. Starts at 0 for all new merchants and grows over time.

| Factor | How Collected | Weight within Category |
|---|---|---|
| Number of loans taken | Loan Module (post-launch) | — |
| On-time repayment rate | Loan Module repayment tracker | — |
| Outstanding balance ratio | Loan Module | — |
| Repayment consistency | Loan Module | — |

**App coverage:** ❌ Loan Module not yet built. This category defaults to 0 for new merchants; its 10% weight is redistributed proportionally across the other 5 categories until the first loan is taken.

---

## 4. Weight Redistribution for New Merchants

When Category 6 (Loan History) has no data, the 10% is redistributed:

| Category | Normal Weight | Redistributed Weight (no loan history) |
|---|---|---|
| Business Activity & Revenue | 25% | 28% |
| Purchase & Receipt Verification | 20% | 23% |
| Expense & Cash Flow | 15% | 17% |
| App Behavior | 15% | 17% |
| KYC & Identity | 15% | 15% |
| Loan History | 10% | 0% (no data) |

Similarly, if KYC is incomplete, its partial contribution is scaled by completion percentage.

---

## 5. AI Role in Credit Scoring

### 5.1 Data Extraction
- **EasyOCR** extracts structured data (amount, date, supplier, items) from uploaded receipt images.
- This converts unstructured image data into structured features for the scoring model.

### 5.2 Fraud Detection
Before any receipt data is trusted, it passes through a fraud detection pipeline:

```
Image uploaded
    │
    ├─ [ELA — Error Level Analysis] → Detects image editing/manipulation
    ├─ [EXIF Metadata] → Checks creation date, device, GPS consistency
    ├─ [Font Analysis] → Detects inconsistent fonts (sign of digital forgery)
    ├─ [Template Hash] → Detects reuse of same receipt template with different values
    ├─ [Amount Plausibility] → Is this amount realistic for this merchant's business scale?
    ├─ [Supplier Consistency] → Does supplier name match known suppliers?
    ├─ [Date Logic] → Is purchase date before corresponding sales?
    └─ [Frequency Check] → Unusual spike in receipt submissions?

Verdict: AUTHENTIC / SUSPICIOUS / PENDING
```

Only AUTHENTIC receipts are added to the credit scoring record.

### 5.3 Score Calculation Model
**Algorithm:** XGBoost (Gradient Boosted Trees)
- Handles missing features gracefully (sparse data for new merchants)
- Produces feature importance for human-readable score breakdown
- Inference time: < 100ms

### 5.4 Prediction Integration
The prediction engine (Prophet / LSTM) feeds forward-looking signals into the score:
- Merchants with stable or growing predicted sales receive a slight score boost
- Merchants with predicted cash flow risk receive an early warning and slight score reduction

### 5.5 Plain-Language Explanations
After each score calculation, the result + contributing factors are sent to the **Claude API** which returns a 2–3 sentence explanation in the merchant's chosen language:

> *"Your score increased by 4 points this week. Two verified receipts from new suppliers boosted your purchasing power rating. To reach Gold tier, complete your National ID verification."*

---

## 6. Data Privacy & Fraud Prevention

| Concern | Mitigation |
|---|---|
| Merchants submitting fake receipts | Multi-layer forensics pipeline (Section 5.2) rejects manipulated images |
| Collusion between merchants | Supplier name + amount cross-referencing flags implausible patterns |
| Score gaming (sudden bulk uploads) | Frequency checks penalize sudden spikes; gradual consistent history is rewarded |
| Data misuse | Receipt images deleted after verification; only structured extracted data is retained |
| Model bias | Model is trained and audited per business category (a street vendor vs. importer are scored separately) |

---

## 7. Credit Report (for MFI Partners)

When a merchant applies for a loan (Trust Score ≥ 70), the system generates a shareable Credit Report containing:

```
MBOATRUST CREDIT REPORT
Merchant: Jean-Luc Ambassa
Business: Import/Export Logistics
Trust Score: 82 / 100 — Gold Tier

Factor Breakdown:
  Business Activity:         21/25  ████████████████████░░░░░
  Receipt Verification:      16/20  ████████████████░░░░
  Expense & Cash Flow:       12/15  ████████████░░░
  App Behavior:              13/15  █████████████░░
  KYC & Identity:            14/15  ██████████████░
  Loan History:               6/10  ██████░░░░

Key Strengths:
  ✓ 8 months consistent sales records
  ✓ 12 verified purchase receipts (4 suppliers)
  ✓ National ID + RCCM verified

Areas for Improvement:
  ○ Expense-to-revenue ratio: 78% (recommend < 70%)
  ○ No prior loan repayment history

Loan Eligibility:
  Recommended max loan: 450,000 FCFA
  Estimated repayment capacity: 75,000 FCFA/month

Report generated: 2026-04-06 by MboaTrust AI
```

This report is exportable as PDF and can be shared directly with MFI partners.
