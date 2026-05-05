# Technical Specification
# MboaTrust AI — Mobile Application

**Version:** 2.0
**Date:** 2026-04-06
**Status:** Updated — reflects all architectural decisions as of 2026-04-06

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native + Expo)           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Landing  │  │   Auth   │  │Dashboard │  │  Records   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Verif'tion│  │ Trust    │  │Statistics│  │   Loan     │  │
│  │(receipts)│  │  Score   │  │& Predict │  │  Module    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         WatermelonDB (SQLite — Offline Storage)        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST API (HTTPS)
                               │ WebSocket (real-time alerts)
┌──────────────────────────────▼───────────────────────────────┐
│                    BACKEND (Python + FastAPI)                  │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │  Auth Service│  │Records Service│  │Verification Service│ │
│  │  (OTP, JWT)  │  │(sync, history)│  │(OCR, forensics)   │ │
│  └──────────────┘  └───────────────┘  └───────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │  AI Service  │  │ Score Service │  │ Statistics Service │ │
│  │(OCR, scoring,│  │(calc, update) │  │ (aggregation,     │ │
│  │ predictions) │  │               │  │  predictions)     │ │
│  └──────────────┘  └───────────────┘  └───────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐                        │
│  │ Notif Service│  │  KYC Service  │                        │
│  │(push + SMS)  │  │ (ID, RCCM)    │                        │
│  └──────────────┘  └───────────────┘                        │
└──────────────────────────────┬───────────────────────────────┘
               ┌───────────────┼───────────────┐
               │               │               │
   ┌───────────▼──┐  ┌─────────▼──┐  ┌────────▼─────────┐
   │  PostgreSQL   │  │ Claude API │  │ Africa's Talking │
   │  (Supabase)   │  │(Insights & │  │  (OTP + SMS)     │
   │               │  │ Explanat.) │  │                  │
   └───────────────┘  └────────────┘  └──────────────────┘
```

---

## 2. Frontend — React Native + Expo

### 2.1 Technology Choices

| Package | Purpose |
|---|---|
| `react-native` + `expo` (managed) | Cross-platform mobile (iOS + Android) |
| `expo-router` v3 | File-based navigation (replaces React Navigation for cleaner structure) |
| `nativewind` v4 | Tailwind CSS for React Native — maps cleanly to Figma designs |
| `watermelondb` | Offline-first local database with cloud sync |
| `expo-camera` | Camera access for receipt photo capture |
| `expo-image-picker` | Gallery image selection |
| `expo-file-system` | Local file handling (receipt images) |
| `expo-secure-store` | Encrypted PIN storage |
| `expo-notifications` | Push notification handling |
| `expo-localization` + `i18next` | Multi-language (English / Français / Pidgin) |
| `react-native-reanimated` | Smooth animations (score ring, transitions) |
| `victory-native` | Charts for Statistics section |
| `react-hook-form` + `zod` | Form handling and validation |
| `zustand` | Global state management (lightweight, offline-aware) |

### 2.2 Navigation Structure

```
(app)
├── (auth)
│   ├── splash
│   ├── onboarding (steps 1–3)
│   ├── login
│   ├── register
│   ├── forgot-password
│   ├── otp-verify
│   ├── reset-pin
│   └── privacy-consent
│
├── (kyc)
│   ├── national-id-upload
│   ├── rccm-upload
│   └── kyc-status
│
└── (tabs)                     ← Bottom tab navigation
    ├── home
    │   ├── index (Homepage)
    │   ├── notifications
    │   ├── profile
    │   │   └── edit
    │   ├── language-selection
    │   ├── offline-status
    │   └── help
    │
    ├── verify                 ← Receipt Verification
    │   ├── index (Upload hub)
    │   ├── capture
    │   ├── result-authentic
    │   ├── result-suspicious
    │   ├── result-pending
    │   ├── receipt-detail
    │   ├── manual-entry
    │   └── history
    │
    ├── records
    │   ├── index (Overview hub)
    │   ├── sales
    │   │   ├── history
    │   │   └── add
    │   ├── expenses
    │   │   ├── history
    │   │   └── add
    │   └── stock
    │       ├── history
    │       ├── supplier-directory
    │       └── add
    │
    ├── statistics             ← NEW SECTION
    │   ├── index (Overview)
    │   ├── weekly
    │   ├── monthly
    │   ├── annual
    │   ├── predictions
    │   └── prediction-detail
    │
    └── score
        ├── index (Trust Score Details)
        ├── breakdown (Credit Score Breakdown)
        ├── financial-summary
        ├── verification-hub
        ├── insights-alerts
        └── loan
            ├── apply
            └── repayment-tracker
```

### 2.3 Offline Sync Strategy

1. All user actions (add sale, add expense, upload receipt) are written to WatermelonDB immediately.
2. A background sync queue monitors connectivity.
3. When online: pending records are uploaded to Supabase in order of creation timestamp.
4. Receipt images are uploaded as binary blobs to Supabase Storage; OCR/verification runs server-side.
5. Conflict resolution: last-write-wins using server timestamp.
6. Trust Score recalculation is triggered server-side after each sync.

---

## 3. Backend — Python + FastAPI

### 3.1 Service Breakdown

#### Auth Service
- Phone + PIN registration
- JWT token issuance (access + refresh)
- OTP generation and verification via Africa's Talking
- PIN reset flow

#### Records Service
- CRUD for sales, expenses, stock purchases
- Sync endpoint (batch upload from WatermelonDB)
- History and filtering queries

#### Verification Service (REVISED 2026-04-06)
- Accepts receipt image upload (multipart/form-data)
- Passes image to AI Service for OCR + forensics
- Stores verification result with parsed data
- Updates Trust Score after verified receipt is saved

#### AI Service
- OCR pipeline (EasyOCR): extracts amount, date, supplier, items from receipt
- Fraud detection pipeline: image forensics + cross-validation against merchant records
- Credit scoring model inference (XGBoost)
- Prediction engine (Prophet / LSTM)
- Claude API integration for plain-language insight generation

#### Score Service
- Computes Trust Score from 6 weighted factor categories
- Emits real-time score update via WebSocket to mobile app
- Generates score breakdown and "how to improve" actions

#### Statistics Service
- Aggregates merchant transaction data into weekly/monthly/annual summaries
- Triggers prediction model inference when sufficient data threshold met
- Returns chart-ready JSON structures

#### KYC Service
- Accepts National ID images
- Runs OCR to extract ID name, NIN
- Cross-validates against registration data
- Updates KYC verification badge status

#### Notification Service
- Push notifications via Expo Push API
- Critical alerts via Africa's Talking SMS
- Notification preference management

### 3.2 API Design Principles
- RESTful endpoints, versioned under `/api/v1/`
- JWT Bearer token authentication on all protected routes
- Multipart form data for image uploads
- WebSocket endpoint `/ws/score/{merchant_id}` for real-time score updates
- All responses in JSON with consistent `{ data, error, meta }` envelope

### 3.3 Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp/send
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/pin/reset

POST   /api/v1/kyc/id-upload
POST   /api/v1/kyc/rccm-upload
GET    /api/v1/kyc/status

POST   /api/v1/records/sync          ← Batch sync from WatermelonDB
GET    /api/v1/records/sales
POST   /api/v1/records/sales
GET    /api/v1/records/expenses
POST   /api/v1/records/expenses
GET    /api/v1/records/stock
POST   /api/v1/records/stock

POST   /api/v1/verify/receipt        ← Upload + verify merchant's own receipt
GET    /api/v1/verify/history
GET    /api/v1/verify/{id}/detail

GET    /api/v1/score
GET    /api/v1/score/breakdown
GET    /api/v1/score/history
WS     /ws/score/{merchant_id}

GET    /api/v1/statistics/weekly
GET    /api/v1/statistics/monthly
GET    /api/v1/statistics/annual
GET    /api/v1/predictions
GET    /api/v1/predictions/{type}

GET    /api/v1/insights/daily        ← Claude API powered
```

---

## 4. Database — PostgreSQL (Supabase)

### 4.1 Core Tables

```sql
merchants
  id, phone_number, full_name, business_category,
  pin_hash, kyc_status, trust_score, created_at, updated_at

merchant_kyc
  id, merchant_id, id_document_url, rccm_url,
  extracted_name, nin, verified_at, status

sales
  id, merchant_id, amount, payment_method, category,
  customer_tag, notes, recorded_at, synced_at

expenses
  id, merchant_id, amount, category, notes,
  receipt_image_url, recorded_at, synced_at

stock_purchases
  id, merchant_id, item_name, amount, supplier_name,
  purchase_date, category, trust_ready, synced_at

receipt_verifications
  id, merchant_id, image_url, ocr_data (jsonb),
  verification_status, fraud_signals (jsonb),
  score_contribution, created_at

trust_score_history
  id, merchant_id, score, factor_breakdown (jsonb),
  computed_at

predictions
  id, merchant_id, type, value, confidence,
  data_basis (jsonb), generated_at, expires_at

loans (post-launch)
  id, merchant_id, amount, status, disbursed_at,
  repayment_schedule (jsonb), last_payment_at
```

---

## 5. AI Layer — Detailed Design

### 5.1 Receipt Verification Pipeline

```
INPUT: Receipt image (JPG/PNG/PDF)
       │
       ▼
[1] PRE-PROCESSING
    - Resize, denoise, deskew
    - Convert to grayscale for OCR
       │
       ▼
[2] OCR (EasyOCR)
    - Extract: amount, date, supplier name, items, total
    - Output: structured JSON with confidence scores
       │
       ▼
[3] IMAGE FORENSICS
    - EXIF metadata check (creation date, device, GPS)
    - ELA (Error Level Analysis) — detects image editing
    - Font consistency check (printed receipts have uniform fonts)
    - Template hash check (same template reused repeatedly = suspicious)
       │
       ▼
[4] CROSS-VALIDATION (against merchant's own data)
    - Amount plausibility: is this within the merchant's business scale?
    - Supplier match: is this supplier name consistent with history?
    - Date logic: is the purchase date before related sales?
    - Frequency: how many receipts submitted today/this week?
       │
       ▼
[5] VERDICT
    - AUTHENTIC: high confidence, all checks passed
    - SUSPICIOUS: one or more red flags — reason returned
    - PENDING: low image quality or inconclusive — queued for review
       │
       ▼
[6] SCORE UPDATE
    - Authentic receipts → add to purchasing power record
    - Trigger Trust Score recalculation
```

### 5.2 Credit Scoring Model

**Algorithm:** XGBoost (Gradient Boosted Trees)
- Interpretable, handles missing features well (new merchants with sparse data)
- Fast inference: < 100ms per score calculation
- Feature importance exportable for score breakdown

**Features fed to the model:**

```python
features = {
    # Business Activity (25%)
    "monthly_sales_total": float,
    "sales_consistency_score": float,     # coefficient of variation
    "revenue_growth_rate": float,
    "avg_transaction_value": float,
    "transaction_frequency": int,
    "unique_customer_count": int,

    # Purchase & Receipt Verification (20%)
    "verified_receipt_count": int,
    "verified_receipt_amount_total": float,
    "receipt_authenticity_rate": float,   # verified / total submitted
    "supplier_diversity_count": int,
    "purchase_to_sales_ratio": float,

    # Expense & Cash Flow (15%)
    "expense_to_revenue_ratio": float,
    "expense_growth_rate": float,
    "cash_flow_volatility": float,
    "top_expense_category_share": float,

    # App Behavior (15%)
    "days_active_last_30": int,
    "record_logging_regularity": float,
    "profile_completeness_pct": float,
    "feature_adoption_score": float,      # how many features used
    "data_consistency_score": float,      # internal contradiction check

    # KYC & Identity (15%)
    "phone_verified": bool,
    "id_document_verified": bool,
    "rccm_verified": bool,
    "account_age_days": int,
    "business_category_declared": bool,

    # Loan History (10%)
    "loans_taken": int,
    "on_time_repayment_rate": float,
    "outstanding_balance_ratio": float,
}
```

**Output:**
```python
{
    "score": 82,                    # 0–100
    "confidence": 0.91,
    "category_contributions": {
        "business_activity": 21,    # out of 25
        "receipt_verification": 16, # out of 20
        "expense_cash_flow": 12,    # out of 15
        "app_behavior": 13,         # out of 15
        "kyc_identity": 14,         # out of 15
        "loan_history": 6           # out of 10
    },
    "improving_factors": ["High sales consistency", "3 verified receipts this month"],
    "hurting_factors": ["Expense ratio above 75%", "No RCCM uploaded"],
    "next_milestone": "Gold Tier at score 85"
}
```

### 5.3 Prediction Engine

**Algorithm:** Facebook Prophet (time-series) for sales/cash flow forecasts.
**Fallback (< 4 weeks data):** Rules-based calculations using industry averages by business category.

| Prediction | Model Input | Output |
|---|---|---|
| Sales Forecast | Daily sales last N weeks | Projected sales next 7/30 days ± confidence interval |
| Restock Timing | Stock purchase dates + sales velocity per item | Estimated depletion date per product |
| Cash Flow Warning | Daily net cash flow (sales - expenses) | Projected shortfall date if trend continues |
| Slow Period | Historical weekly patterns | Flag upcoming low-traffic weeks |
| Expense Creep | Monthly expense by category | % change vs 3-month average |
| Loan Repayment Capacity | Monthly net profit + cash flow stability | Max monthly repayment amount |
| Business Trajectory | 3-month revenue + expense trend | Growth / Stable / Declining + % change |

### 5.4 AI Insights (Claude API)

- Model: `claude-haiku-4-5` (fast, cost-efficient for frequent calls)
- Called once per day per merchant to generate the Homepage Insight
- Called on-demand for score change explanations
- Called for alert explanations (why a payment is suspicious, why score dropped)
- All prompts inject: merchant business category, recent record summary, current score, locale language

---

## 6. Authentication & Security

| Concern | Approach |
|---|---|
| PIN Storage | expo-secure-store (device keychain / keystore) — never stored in plain text |
| API Auth | JWT (access token 15min + refresh token 30 days) |
| OTP | 6-digit, 5-minute expiry, Africa's Talking delivery |
| Image Privacy | Receipt images stored in Supabase Storage with row-level security (RLS) — only the merchant's own images are accessible |
| Data Encryption | TLS 1.3 in transit; AES-256 at rest in Supabase |
| KYC Documents | Stored in isolated, access-controlled bucket; deleted after verification |
| Consent | All data processing requires explicit opt-in at registration (Privacy & Consent screen) |

---

## 7. Third-Party Integrations

| Service | Purpose | Notes |
|---|---|---|
| Supabase | PostgreSQL hosting + Storage + Auth helpers | Free tier sufficient for MVP |
| Africa's Talking | SMS OTP delivery + critical fraud alerts | Best Cameroon coverage |
| Claude API (Anthropic) | Business insights, score explanations | Use `claude-haiku-4-5` for cost |
| Expo Push Service | Mobile push notifications | Free, integrates with FCM/APNs |
| EasyOCR | Receipt text extraction | Open source, self-hosted on backend |
