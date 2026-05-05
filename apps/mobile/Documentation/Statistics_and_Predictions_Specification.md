# Statistics & AI Predictions Specification
# MboaTrust AI

**Version:** 1.0
**Date:** 2026-04-06

---

## 1. Overview

The Statistics section is a dedicated area of the MboaTrust AI app that gives merchants a clear picture of their business performance over time. It serves two purposes:

1. **Business Intelligence:** Merchants see their performance in a simple, visual format — weekly, monthly, and annually — enabling better business decisions without needing accounting knowledge.

2. **AI Training Substrate:** The accumulated transaction data (anonymized and aggregated) is used to train a prediction engine that forecasts future business events.

---

## 2. Statistics Section — Navigation

The Statistics section is accessed from the bottom navigation bar (5th tab). It contains:

```
Statistics (Tab)
├── Overview Screen        ← Entry point with timeframe selector
├── Weekly Detail Screen
├── Monthly Detail Screen
├── Annual Detail Screen
├── AI Predictions Dashboard
└── Prediction Detail Screen
```

---

## 3. Statistics Overview Screen

### 3.1 Timeframe Toggle
Three tabs: **Weekly | Monthly | Annual**

Default view on entry: **Monthly**

### 3.2 Data Displayed (per timeframe)

| Metric | Weekly | Monthly | Annual |
|---|---|---|---|
| Total Sales (FCFA) | ✅ | ✅ | ✅ |
| Total Expenses (FCFA) | ✅ | ✅ | ✅ |
| Net Profit (FCFA) | ✅ | ✅ | ✅ |
| Growth vs Previous Period | ✅ | ✅ | ✅ |
| Top Selling Category | ✅ | ✅ | ✅ |
| Top Expense Category | ✅ | ✅ | ✅ |
| Verified Receipts Count | — | ✅ | ✅ |
| Expense-to-Revenue Ratio | — | ✅ | ✅ |
| Best Performing Week/Month | — | ✅ | ✅ |
| Year-over-Year Comparison | — | — | ✅ |

### 3.3 Charts

| Chart Type | Used For |
|---|---|
| Line chart | Sales + Expenses trend over time |
| Bar chart | Weekly comparison within a month / Monthly comparison within a year |
| Donut chart | Expense category breakdown |
| Area chart | Net profit trend |

**Library:** `victory-native` (React Native compatible, offline-capable)

---

## 4. Weekly Statistics Detail

Covers the 7 most recent days (Mon–Sun).

**Content:**
- Day-by-day sales bar chart
- Total sales, expenses, net profit for the week
- Best day of the week
- Comparison vs previous week (+/- %)
- Top category sold this week
- AI tip for the coming week (Claude API, 1 sentence)

---

## 5. Monthly Statistics Detail

Covers the current calendar month.

**Content:**
- Week-by-week sales breakdown (4 bars)
- Total sales, expenses, net profit
- Expense breakdown donut chart
- Comparison vs last month (+/- %)
- Number of unique customers tagged (if data exists)
- Number of verified receipts uploaded
- Expense-to-revenue ratio with health indicator (green < 70%, yellow 70–85%, red > 85%)
- AI Monthly Business Health Score (computed by scoring model — separate from Trust Score)

---

## 6. Annual Statistics Detail

Covers the current calendar year (or last 12 months if < 1 year registered).

**Content:**
- Month-by-month sales line chart (12 months)
- Total annual revenue, total expenses, net annual profit
- Best month / worst month
- Year-over-year comparison (if data available)
- Annual expense category breakdown
- Trust Score progression chart (start of year to now)
- Annual AI Business Summary (Claude API, 3–4 sentences)

---

## 7. AI Predictions Dashboard

### 7.1 Access Conditions

| Condition | Behavior |
|---|---|
| < 2 weeks of data | Predictions section shows "Not enough data yet" with tips to add records |
| 2–4 weeks of data | Rules-based early estimates shown, labeled as "Early Estimate" |
| 4+ weeks of data | Full AI predictions shown with confidence percentages |

### 7.2 Prediction Cards

Each prediction is displayed as a card with:
- Prediction type icon
- Headline (e.g., "Sales likely to drop next week")
- Key metric (e.g., "-18% vs this week")
- Confidence badge (High / Medium / Low)
- "View Details" link

### 7.3 The 7 Predictions

#### Prediction 1: Sales Forecast
- **What:** Projected total revenue for the next 7 days and next 30 days
- **Model:** Facebook Prophet time-series on daily sales data
- **Output:** "Expected sales: 380,000 – 420,000 FCFA next week"
- **Useful for:** Cash flow planning, stock preparation
- **Minimum data:** 4 weeks of daily sales

#### Prediction 2: Restock Timing
- **What:** Estimated date when a specific stock item will run out
- **Model:** Linear regression on sales velocity per item category vs last stock purchase date
- **Output:** "Premium White Rice: likely depleted in 4 days (based on 12kg/day sales rate)"
- **Useful for:** Preventing stockouts, planning market trips
- **Minimum data:** 2 weeks of sales + at least 1 stock purchase per item

#### Prediction 3: Cash Flow Warning
- **What:** Predicted date when cash on hand may run dangerously low
- **Model:** Projected net cash flow (sales forecast - expense trend)
- **Output:** "Possible cash shortfall around April 22 — expenses trending 15% above sales this week"
- **Useful for:** Avoiding inability to restock, planning credit needs
- **Minimum data:** 3 weeks of both sales and expense records

#### Prediction 4: Slow Period Detection
- **What:** Upcoming weeks or months historically associated with low sales
- **Model:** Seasonal decomposition using Prophet; compares against same period in prior year(s)
- **Output:** "August typically sees 25–35% lower sales in your category. Start of August is 6 weeks away."
- **Useful for:** Reducing stock purchases before slow season, saving cash
- **Minimum data:** 6+ months of data (or category-level benchmarks for new merchants)

#### Prediction 5: Expense Creep Alert
- **What:** Expense categories growing faster than revenue
- **Model:** Month-over-month growth rate comparison per category vs revenue growth
- **Output:** "Transport costs up 42% vs last month while sales grew only 8%. Consider reviewing transport routes."
- **Useful for:** Identifying cost leaks, protecting profit margins
- **Minimum data:** 2 months of expense records

#### Prediction 6: Loan Repayment Capacity
- **What:** The maximum monthly loan repayment amount the merchant can sustainably service
- **Model:** Based on average monthly net profit (after expenses) over last 3 months, with 40% buffer
- **Output:** "Based on your average monthly profit of 185,000 FCFA, you can safely repay up to 74,000 FCFA/month"
- **Useful for:** Determining safe loan size before applying
- **Minimum data:** 3 months of sales + expense records
- **Note:** This feeds directly into the loan eligibility displayed in the Trust Score section

#### Prediction 7: Business Health Trajectory
- **What:** Whether the business is growing, stable, or declining — and at what rate
- **Model:** Linear regression on 3-month revenue and expense trends
- **Output:** "Growing — your monthly revenue has increased an average of 8.3% over the last 3 months"
- **Useful for:** Merchant confidence, MFI loan reports
- **Minimum data:** 3 months of records

---

## 8. Prediction Detail Screen

Tapping any prediction card opens a detail view containing:

- Full prediction description in plain language
- The data it was based on (e.g., "Based on your last 8 weeks of sales")
- Confidence level + explanation of what affects confidence
- Recommended action (1–2 steps)
- "Add to Reminder" button (sets a push notification for a future date)

---

## 9. AI Training Pipeline

### 9.1 Data Flow

```
Individual Merchant Records
    │
    ▼
Anonymization Layer
(strip merchant_id, name, phone — keep: business_category, region, amounts, dates)
    │
    ▼
Aggregation Service (weekly batch job)
    │
    ▼
Training Dataset (partitioned by business_category)
    │
    ├─ Sales Forecasting Model (Prophet) — retrained weekly
    ├─ Restock Timing Model (Linear regression) — retrained weekly
    ├─ Cash Flow Model (Prophet) — retrained weekly
    └─ Slow Period Model (Seasonal decomposition) — retrained monthly
```

### 9.2 Cold Start Strategy

New merchants with < 4 weeks of data receive predictions from two sources:
1. **Category Benchmarks:** Aggregated statistics from all merchants in the same business category
2. **Rules-based estimates:** Simple formulas (e.g., project next week = average of last 2 weeks)

These are labeled clearly as "Early Estimates" in the UI, with an explanation that predictions improve as more records are added.

### 9.3 Model Improvement Loop

As more merchants use the app and more data accumulates:
- Models are retrained on richer datasets
- Category-specific models become more accurate
- Regional patterns emerge (e.g., market day effects in specific cities)
- Slow period models improve with multi-year data

---

## 10. Privacy Considerations

- Individual merchant data is **never shared** with other merchants or third parties in raw form.
- Only **anonymized, aggregated** data is used for model training.
- Merchants are informed of this in the Privacy & Consent screen at registration.
- Merchants can opt out of contributing to model training (this does not affect their personal predictions, which use only their own data).
