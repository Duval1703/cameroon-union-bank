# MboaTrust AI — Implementation Plan

**Version:** 1.0
**Date:** 2026-04-06
**Status:** Awaiting approval before execution begins

---

## Overview

The project is divided into **9 phases** across 3 major milestones:

| Milestone | Phases | Goal |
|---|---|---|
| **M1 — MVP** | Phase 0 → Phase 3 | Working app: auth, records, receipt verification |
| **M2 — Full Launch** | Phase 4 → Phase 7 | Complete product: KYC, Trust Score, Statistics, AI insights |
| **M3 — Post-Launch** | Phase 8 → Phase 9 | Loan module, optimization, scale |

### Rules Before Any Phase Begins
1. Implementation plan for each phase is reviewed and approved before coding starts.
2. `project.md` is updated at the end of every working session.
3. No feature scope expansion mid-phase without explicit approval.
4. UI screens must be designed/approved before frontend implementation begins.

---

## Phase 0 — Project Setup & Infrastructure

**Goal:** Working skeleton. Every developer can run the project locally. All infrastructure is provisioned.

### 0.1 Repository & Project Structure

- [ ] Initialize Git repository with branch strategy:
  - `main` — production
  - `develop` — integration
  - `feature/*` — individual features
- [ ] Create monorepo structure:
  ```
  /mboatrust-ai
  ├── /mobile        ← React Native + Expo app
  ├── /backend       ← FastAPI Python backend
  ├── /ai            ← ML models, training scripts
  ├── /docs          ← All .md documentation
  └── /shared        ← Shared types/schemas
  ```
- [ ] Set up `.gitignore`, `.env.example` files for both mobile and backend
- [ ] Set up `README.md` with setup instructions for both apps

### 0.2 Backend — FastAPI Setup

- [ ] Initialize Python project with `pyproject.toml` (use `uv` or `poetry`)
- [ ] Install core dependencies:
  - `fastapi`, `uvicorn`, `pydantic`
  - `sqlalchemy`, `asyncpg` (async PostgreSQL driver)
  - `alembic` (database migrations)
  - `python-jose` (JWT)
  - `python-multipart` (file uploads)
  - `httpx` (async HTTP client for external APIs)
- [ ] Create folder structure:
  ```
  /backend
  ├── /app
  │   ├── /api/v1        ← Route handlers
  │   ├── /services      ← Business logic
  │   ├── /models        ← SQLAlchemy models
  │   ├── /schemas       ← Pydantic schemas
  │   ├── /core          ← Config, security, JWT
  │   └── main.py
  ├── /migrations        ← Alembic migrations
  └── /tests
  ```
- [ ] Configure environment variables: `DATABASE_URL`, `JWT_SECRET`, `AFRICAS_TALKING_KEY`, `ANTHROPIC_API_KEY`
- [ ] Set up basic health check endpoint: `GET /health`
- [ ] Configure CORS for mobile app

### 0.3 Database — Supabase + PostgreSQL

- [ ] Create Supabase project
- [ ] Run initial Alembic migration creating all core tables:
  - `merchants`
  - `merchant_kyc`
  - `sales`
  - `expenses`
  - `stock_purchases`
  - `receipt_verifications`
  - `trust_score_history`
  - `predictions`
  - `notifications`
- [ ] Configure Row Level Security (RLS) policies — merchants can only access their own data
- [ ] Create Supabase Storage buckets:
  - `receipt-images` (private, RLS enforced)
  - `kyc-documents` (private, restricted)
- [ ] Set up database connection pooling

### 0.4 Mobile — Expo Setup

- [ ] Initialize Expo project:
  ```bash
  npx create-expo-app mobile --template tabs
  ```
- [ ] Install core dependencies:
  - `nativewind` v4 + `tailwindcss`
  - `expo-router` v3
  - `zustand`
  - `react-hook-form` + `zod`
  - `watermelondb` + `@nozbe/watermelondb`
  - `expo-secure-store`
  - `expo-camera`
  - `expo-image-picker`
  - `expo-notifications`
  - `expo-localization` + `i18next` + `react-i18next`
  - `victory-native` (charts)
  - `react-native-reanimated`
  - `axios` (API client)
- [ ] Set up folder structure:
  ```
  /mobile
  ├── /app               ← expo-router file-based routes
  │   ├── (auth)/
  │   ├── (kyc)/
  │   └── (tabs)/
  ├── /components        ← Reusable UI components
  ├── /hooks             ← Custom React hooks
  ├── /stores            ← Zustand stores
  ├── /services          ← API client functions
  ├── /db                ← WatermelonDB models + schema
  ├── /locales           ← i18n translation files (en, fr, pidgin)
  ├── /theme             ← NativeWind / Tailwind config
  └── /utils
  ```
- [ ] Configure NativeWind with Tailwind theme matching MboaTrust design system (colors, fonts)
- [ ] Set up i18n with English, Français, Pidgin translation files
- [ ] Configure `app.json` / `eas.json` for build profiles (development, preview, production)

### 0.5 AI Environment Setup

- [ ] Set up Python AI project inside `/ai` directory
- [ ] Install AI dependencies:
  - `easyocr` (OCR)
  - `xgboost`, `scikit-learn` (credit scoring)
  - `prophet` (time-series predictions)
  - `pillow`, `opencv-python` (image processing)
  - `anthropic` (Claude API)
  - `numpy`, `pandas`
- [ ] Create dummy model stubs (return placeholder results) so backend endpoints can be wired before real models are trained
- [ ] Set up model versioning folder: `/ai/models/`

**Phase 0 Deliverables:**
- Both apps run locally without errors
- Database schema is live on Supabase
- Health check endpoint returns 200
- All environment variables documented

---

## Phase 1 — Authentication & Navigation Shell

**Goal:** A merchant can register, log in, verify OTP, and land on a working (empty) navigation shell. Offline detection works.

### 1.1 Backend — Auth Service

- [ ] `POST /api/v1/auth/register`
  - Validate: phone, name, business_category, pin
  - Hash PIN with bcrypt
  - Insert merchant record
  - Send welcome SMS via Africa's Talking
  - Return JWT access + refresh tokens
- [ ] `POST /api/v1/auth/login`
  - Validate phone + PIN
  - Return JWT tokens
- [ ] `POST /api/v1/auth/otp/send`
  - Generate 6-digit OTP
  - Store with 5-min expiry in Redis (or in-memory for MVP)
  - Send via Africa's Talking SMS
- [ ] `POST /api/v1/auth/otp/verify`
  - Validate OTP code
  - Return verified token
- [ ] `POST /api/v1/auth/pin/reset`
  - Accepts verified OTP token + new PIN
  - Update hashed PIN in database
- [ ] `POST /api/v1/auth/token/refresh`
  - Exchange refresh token for new access token
- [ ] JWT middleware — protect all non-auth routes

### 1.2 Mobile — Auth Screens

- [ ] **Splash Screen** (L-01) — logo, tagline, auto-navigate after 2s
- [ ] **Onboarding flow** (L-02 to L-07) — 3-step carousel, skip button, shown only on first launch (AsyncStorage flag)
- [ ] **Login Screen** (A-01) — phone + PIN form, validation, API call, JWT storage in expo-secure-store
- [ ] **Merchant Registration** (A-02) — multi-field form, business category picker, PIN creation + confirm
- [ ] **Forgot Password** (A-03) — phone entry, trigger OTP
- [ ] **OTP Verify** (A-05) — 6-digit input, countdown timer, resend option
- [ ] **Reset PIN** (A-06 — NEW) — new PIN + confirm form
- [ ] **Privacy & Consent** (A-04) — toggle checkboxes, must accept to proceed

### 1.3 Mobile — Navigation Shell

- [ ] Set up bottom tab navigator with 5 tabs: Home, Verify, Records, Statistics, Profile
- [ ] All tab screens show placeholder "Coming Soon" content at this stage
- [ ] Implement offline detection hook using `@react-native-community/netinfo`
- [ ] Display offline banner component on all screens when disconnected

### 1.4 Mobile — Language System

- [ ] Set up i18next with 3 locale files: `en.json`, `fr.json`, `pidgin.json`
- [ ] Wire Language Selection screen (D-06) to i18n context
- [ ] Detect device locale on first launch, default to matching language
- [ ] All hardcoded strings in auth screens replaced with i18n keys

### 1.5 Mobile — WatermelonDB Setup

- [ ] Define WatermelonDB schema with tables: `sales`, `expenses`, `stock_purchases`, `receipts`, `sync_queue`
- [ ] Implement `useSyncStatus` hook that monitors network and triggers sync
- [ ] Implement sync service: pushes pending local records to backend on reconnect

**Phase 1 Screens Delivered:** L-01 through L-07, A-01 through A-06, D-06
**Phase 1 Deliverables:**
- Full auth flow works end-to-end
- OTP SMS delivered via Africa's Talking
- JWT auth persists across app restarts
- Bottom navigation shell is in place
- Offline banner displays correctly

---

## Phase 2 — Business Record Keeping

**Goal:** Merchants can log sales, expenses, and stock purchases. Records persist offline and sync to the cloud. History screens are functional.

### 2.1 Backend — Records Service

- [ ] `POST /api/v1/records/sync` — Batch upsert from WatermelonDB (handles offline sync)
- [ ] `GET /api/v1/records/sales` — Paginated, filterable by date range
- [ ] `POST /api/v1/records/sales` — Create single sale
- [ ] `GET /api/v1/records/expenses` — Paginated, filterable by category
- [ ] `POST /api/v1/records/expenses` — Create single expense
- [ ] `GET /api/v1/records/stock` — Paginated
- [ ] `POST /api/v1/records/stock` — Create stock purchase
- [ ] `GET /api/v1/records/summary` — Returns totals for dashboard (today, week, month)

### 2.2 Backend — AI Category Prediction (stub → real)

- [ ] `POST /api/v1/ai/categorize` — Given amount + time + merchant category → return predicted sale/expense category
- [ ] Phase 2: implement as rules-based logic (e.g., amount < 5000 + morning = "Retail")
- [ ] Phase 6: upgrade to ML-based category prediction

### 2.3 Mobile — Records Screens

- [ ] **Records Overview Hub** (R-01 — NEW) — Cards for Sales / Expenses / Stock with today's totals, quick-add buttons
- [ ] **Add Sale** (R-02 — modified) — Amount, payment method, date/time, AI category, optional Customer Tag field, notes
- [ ] **Sales History** (R-03) — Chronological list, search by customer/date, AI Performance Pulse at bottom
- [ ] **Add Expense** (R-04) — Amount, category picker, date/time, notes, optional receipt image
- [ ] **Expense History** (R-05 — NEW) — Chronological expense list, category filter tabs
- [ ] **Add Stock Purchase** (R-06 — modified) — Item name, amount, date, Supplier Name field (required), AI category suggestion, Trust Score readiness indicator
- [ ] **Stock / Purchase History** (R-07 — NEW) — Chronological list grouped by supplier
- [ ] **Supplier Directory** (R-08 — NEW) — Auto-populated list of all unique suppliers entered
- [ ] **Success: Record Saved** (R-09) — Reusable confirmation screen (amount, category, reference ID, "Add Another" / "Done")

### 2.4 Mobile — Offline Record Handling

- [ ] All record creation writes to WatermelonDB first (instant, offline-safe)
- [ ] Pending sync indicator on Records Overview showing unsynced count
- [ ] Sync executes automatically on network reconnect
- [ ] Conflict resolution: server timestamp wins on duplicates

### 2.5 Mobile — Dashboard: Homepage

- [ ] **Homepage** (D-01) — Wire up real data:
  - Today's total sales from WatermelonDB
  - Quick Action buttons navigate to Add Sale / Add Expense / Verify screens
  - Recent Activity list from last 5 records
  - Trust Score ring (static placeholder at this phase — real score in Phase 5)
  - AI Business Insight (static placeholder — real in Phase 7)

**Phase 2 Screens Delivered:** R-01 through R-09, D-01 (partial)
**Phase 2 Deliverables:**
- Full CRUD for all 3 record types
- Records persist offline and sync online
- All history screens functional with real data
- Homepage shows real sales totals

---

## Phase 3 — Receipt Verification

**Goal:** Merchants can upload purchase receipts. AI verifies authenticity. Results are stored and contribute to their purchasing history.

### 3.1 Backend — Verification Service

- [ ] `POST /api/v1/verify/receipt` — Accepts multipart image upload
  - Save image to Supabase Storage
  - Queue for AI processing (async task via background worker)
  - Return job ID immediately (pending state)
- [ ] `GET /api/v1/verify/{job_id}/status` — Poll verification status
- [ ] `GET /api/v1/verify/history` — List all merchant's verification results
- [ ] `GET /api/v1/verify/{id}/detail` — Full parsed receipt detail
- [ ] WebSocket `/ws/verify/{job_id}` — Real-time result push when processing completes

### 3.2 AI — Receipt Verification Pipeline

#### 3.2.1 Pre-processing
- [ ] Image resize and normalization
- [ ] Deskew and denoise (OpenCV)
- [ ] Convert to grayscale for OCR

#### 3.2.2 OCR (EasyOCR)
- [ ] Extract: supplier name, total amount, date, line items
- [ ] Return structured JSON with confidence scores per field
- [ ] Handle: printed receipts, handwritten notes, low-quality phone photos

#### 3.2.3 Image Forensics
- [ ] EXIF metadata extraction (creation date, device, GPS if present)
- [ ] ELA — Error Level Analysis (detects post-processing / digital manipulation)
- [ ] Font consistency analysis (reused digital templates have inconsistent fonts)
- [ ] Template hash check (flag if identical template submitted before with different values)
- [ ] Resolution and compression artifact analysis

#### 3.2.4 Cross-Validation
- [ ] Amount plausibility check: compare to merchant's average purchase amounts
- [ ] Supplier name matching: compare to previously used suppliers
- [ ] Date logic check: is purchase date before related sales of same category?
- [ ] Frequency anomaly: flag unusual submission volume spikes

#### 3.2.5 Verdict Engine
- [ ] AUTHENTIC: confidence ≥ 0.80, no fraud signals
- [ ] SUSPICIOUS: one or more fraud signals detected — return specific reasons
- [ ] PENDING: confidence 0.60–0.79 or image quality too low — manual review queue

### 3.3 Mobile — Verification Screens

- [ ] **Verification Hub** (V-01 — redesigned) — Updated copy: "Verify Your Purchase Receipts", three options: Upload, Camera, Manual
- [ ] **Capture Receipt** (V-02 — copy update) — Updated to merchant receipt context
- [ ] **Result: Authentic** (V-03 — NEW) — Supplier name, amount, date, items, score contribution earned, "Save to Records" button
- [ ] **Result: Suspicious** (V-04 — updated) — Updated risk factor labels for receipt forgery context
- [ ] **Result: Pending** (V-05) — Reuse existing screen — processing message
- [ ] **Receipt Detail View** (V-07 — NEW) — Full parsed data view, verification status badge, Trust Score contribution
- [ ] **Manual Entry** (V-08 — NEW) — Form: supplier, amount, date, items — lower score weight label
- [ ] **Verification History — filled state** (V-09 — NEW) — Chronological list with status badges (Authentic / Suspicious / Pending)
- [ ] **Verification History — empty state** (V-10 — copy update) — "No receipts verified yet" with CTA

### 3.4 Mobile — Real-time Verification Result

- [ ] After upload, show processing animation (V-05 Pending screen)
- [ ] WebSocket listener updates screen automatically when result arrives
- [ ] Push notification sent when result is ready (if user navigated away)

**Phase 3 Screens Delivered:** V-01 through V-10
**Phase 3 Deliverables:**
- Full receipt upload → OCR → forensics → verdict pipeline
- Results stored in DB
- Verification history functional
- MILESTONE M1 (MVP) COMPLETE

---

## Phase 4 — KYC: Identity & Business Verification

**Goal:** Merchants can submit identity documents. AI validates them. KYC badge unlocks 15% of Trust Score credit.

### 4.1 Backend — KYC Service

- [ ] `POST /api/v1/kyc/id-upload` — Accept National ID front + back images
- [ ] `POST /api/v1/kyc/rccm-upload` — Accept RCCM document image
- [ ] `GET /api/v1/kyc/status` — Return verification status per document
- [ ] AI: OCR extracts name and NIN from National ID
- [ ] AI: Cross-validate extracted name against registration name (fuzzy match for Cameroonian name variants)
- [ ] Update `merchant_kyc` table and KYC status badge on profile
- [ ] KYC documents deleted from storage after successful verification (privacy)

### 4.2 Mobile — KYC Screens

- [ ] **KYC Introduction / Prompt** (K-01 — NEW) — Post-registration nudge: "Complete your identity verification to boost your score by up to 15 points"
- [ ] **National ID Upload** (K-02 — NEW) — Front photo + back photo, guidance overlay for correct framing, confirmation of extracted name
- [ ] **RCCM Upload** (K-03 — NEW) — Optional document upload, description of benefit
- [ ] **KYC Verification Status** (K-04 — NEW) — Shows each document: Verified ✓ / Pending ⏳ / Not Submitted ○

### 4.3 Mobile — Profile Integration

- [ ] **Edit Profile** (D-05 — NEW) — Editable form for business info (name, phone, business type, category)
- [ ] **Profile & Settings** (D-04) — Wire KYC badge to real KYC status, add link to KYC screens

**Phase 4 Screens Delivered:** K-01 through K-04, D-05
**Phase 4 Deliverables:**
- KYC upload and verification pipeline functional
- KYC badge updates on profile
- Identity cross-validation working

---

## Phase 5 — Trust Score & Credit Scoring Engine

**Goal:** Trust Score is calculated from real merchant data. Score updates in real time. Score breakdown is visible. Credit Score Breakdown screen functional.

### 5.1 Backend — Score Service

- [ ] Build feature extraction pipeline:
  - Pull all 6 category features from the database for a given merchant
  - Handle missing features gracefully (new merchants with sparse data)
  - Apply weight redistribution when Loan History is empty
- [ ] Train initial XGBoost scoring model:
  - Phase 5: Use synthetic/seeded data to train a baseline model
  - Later: Retrain on real merchant data as it accumulates
- [ ] `GET /api/v1/score` — Return current score + tier
- [ ] `GET /api/v1/score/breakdown` — Return score contribution per category + improving/hurting factors
- [ ] `GET /api/v1/score/history` — Return score over last 6 months
- [ ] Implement score recalculation trigger — called after:
  - New sale / expense / stock record synced
  - Receipt verification result received
  - KYC document verified
- [ ] WebSocket `/ws/score/{merchant_id}` — Push score update to app in real time

### 5.2 Backend — Claude API: Score Explanations

- [ ] After each score recalculation, call Claude API (`claude-haiku-4-5`)
- [ ] Prompt includes: current score, previous score, delta, category contributions, merchant language preference
- [ ] Store generated explanation in DB
- [ ] Return explanation alongside score in API response

### 5.3 Mobile — Trust Score Screens

- [ ] **Merchant Trust Score Details** (T-01) — Wire to real score, real trend chart (last 6 months), real improvement tips from API
- [ ] **Credit Score Breakdown** (T-02 / D-09 — NEW) — 6-category horizontal bars, "What's helping", "What's hurting", Claude-generated explanation
- [ ] **Financial Summary** (T-03) — Wire to real aggregated data, real AI health check, real expense breakdown donut chart

### 5.4 Mobile — Dashboard: Real-time Score

- [ ] Homepage Trust Score ring animates on score change via WebSocket
- [ ] Notifications screen (D-03) shows real score change events
- [ ] **Notifications** (D-03) — Wire to real notification stream from backend

**Phase 5 Screens Delivered:** T-01 through T-03, D-03, D-09
**Phase 5 Deliverables:**
- Trust Score calculated from real merchant data
- Score updates in real time via WebSocket
- Credit Score Breakdown screen with category contributions
- Plain-language score explanations from Claude API

---

## Phase 6 — Statistics & AI Predictions

**Goal:** Full statistics section live. All 7 AI predictions functional. Charts display real data.

### 6.1 Backend — Statistics Service

- [ ] `GET /api/v1/statistics/weekly` — 7-day aggregated sales, expenses, profit, top category
- [ ] `GET /api/v1/statistics/monthly` — Monthly totals, week-by-week breakdown, expense donut data
- [ ] `GET /api/v1/statistics/annual` — 12-month breakdown, year-over-year if available
- [ ] All responses return chart-ready JSON arrays

### 6.2 Backend / AI — Prediction Engine

- [ ] Set up Prophet time-series model for sales forecasting
- [ ] Implement rules-based fallback for merchants with < 4 weeks of data
- [ ] Build each prediction endpoint:
  - `GET /api/v1/predictions/sales-forecast`
  - `GET /api/v1/predictions/restock-timing`
  - `GET /api/v1/predictions/cash-flow-warning`
  - `GET /api/v1/predictions/slow-period`
  - `GET /api/v1/predictions/expense-creep`
  - `GET /api/v1/predictions/loan-capacity`
  - `GET /api/v1/predictions/business-trajectory`
- [ ] Each response includes: value, confidence, data basis, recommended action
- [ ] `GET /api/v1/predictions` — Return all available predictions for the merchant (only predictions with sufficient data are included)
- [ ] Weekly background job: regenerate predictions for all active merchants

### 6.3 Mobile — Statistics Screens

- [ ] **Statistics Overview** (S-01 — NEW) — Timeframe toggle, summary cards (sales/expenses/profit), chart preview, link to Predictions
- [ ] **Weekly Statistics Detail** (S-02 — NEW) — Day-by-day bar chart (victory-native), weekly totals, vs previous week delta, best day, AI weekly tip
- [ ] **Monthly Statistics Detail** (S-03 — NEW) — Week-by-week chart, expense donut chart, expense-to-revenue health ratio, monthly AI summary
- [ ] **Annual Statistics Detail** (S-04 — NEW) — 12-month line chart, annual totals, Trust Score progression chart, annual AI summary
- [ ] **AI Predictions Dashboard** (S-05 — NEW) — Prediction cards grid, confidence badges, last-updated timestamp
- [ ] **Prediction Detail View** (S-06 — NEW) — Full detail: data basis, confidence explanation, recommended action, "Set Reminder" button
- [ ] **Not Enough Data State** (S-07 — NEW) — Empty/early state with progress toward unlocking predictions

### 6.4 Mobile — Charts Implementation

- [ ] Implement reusable chart components using `victory-native`:
  - `<LineChart />` — sales trend, score history
  - `<BarChart />` — weekly/monthly comparison
  - `<DonutChart />` — expense breakdown
  - `<AreaChart />` — cash flow projection
- [ ] All charts respect offline state (show last-fetched data with "Last updated" timestamp)
- [ ] All charts support tap-to-detail interaction

**Phase 6 Screens Delivered:** S-01 through S-07
**Phase 6 Deliverables:**
- All statistics views functional with real data
- All 7 AI predictions working (with rules-based fallback)
- Charts rendered with real merchant data
- Prediction reminder notifications schedulable

---

## Phase 7 — AI Insights, Alerts & Polish

**Goal:** Claude API-powered insights working. Notifications functional. Help screen complete. All remaining dashboard screens polished.

### 7.1 Backend — AI Insights Service (Claude API)

- [ ] Daily insight generation job:
  - Runs once per day per active merchant
  - Builds prompt: business category + last 7 days summary + current score + language
  - Stores generated insight with expiry timestamp
- [ ] `GET /api/v1/insights/daily` — Return today's insight for homepage
- [ ] Alert generation:
  - Triggered by: anomalous receipt submission, score drop > 5pts, cash flow warning threshold crossed
  - Claude API generates alert explanation in merchant's language
  - Stored in notifications table + push notification sent

### 7.2 Backend — Notification Service

- [ ] Expo Push Notification integration:
  - Register device token on login
  - Send push via Expo Push API for: score changes, verification results, AI alerts, reminders
- [ ] Africa's Talking SMS for critical alerts (fraud detection triggers)
- [ ] `GET /api/v1/notifications` — Paginated notification history
- [ ] `POST /api/v1/notifications/{id}/read` — Mark as read

### 7.3 Mobile — Remaining Screens

- [ ] **AI Insights & Alerts** (D-02) — Wire to real insights + alerts from backend, real Trust Level badge
- [ ] **Offline Mode Status** (D-07) — Wire to real sync queue count, real offline records list
- [ ] **Help & Tutorial** (D-08) — Implement search, embed tutorial video links, live chat widget (Intercom or Crisp)
- [ ] **Language Selection** (D-06) — Full i18n wiring for all app strings

### 7.4 Mobile — Final UI Polish

- [ ] Implement smooth score ring animation (react-native-reanimated)
- [ ] Implement skeleton loading screens for all data-fetching screens
- [ ] Implement pull-to-refresh on all list screens
- [ ] Implement error boundary components (graceful error states)
- [ ] Implement empty state components for all list screens
- [ ] Test all screens in Français and Pidgin

**Phase 7 Screens Delivered:** D-02, D-07, D-08 fully wired
**Phase 7 Deliverables:**
- Daily AI insights on homepage (real data)
- Push notifications working
- SMS alerts for critical events
- All UI strings translated into 3 languages
- MILESTONE M2 (FULL LAUNCH) COMPLETE

---

## Phase 8 — Loan Module

**Goal:** Merchants with Trust Score ≥ 70 can apply for microloans. Repayment is tracked in-app.

### 8.1 Backend — Loan Service

- [ ] `GET /api/v1/loan/eligibility` — Check if merchant qualifies (score ≥ 70)
- [ ] `POST /api/v1/loan/apply` — Submit loan application with requested amount
- [ ] `GET /api/v1/loan/status` — Current application or active loan status
- [ ] `POST /api/v1/loan/repayment` — Record a repayment
- [ ] `GET /api/v1/loan/schedule` — Repayment schedule
- [ ] `GET /api/v1/loan/report` — Generate shareable credit report (PDF)
- [ ] Loan repayment events trigger Trust Score recalculation

### 8.2 Mobile — Loan Screens

- [ ] **Loan Eligibility Introduction** (LN-01 — NEW) — Unlocked at score 70, shows eligible amount range
- [ ] **Loan Application** (LN-02 — NEW) — Amount slider, repayment schedule preview, submit
- [ ] **Loan Application Status** (LN-03 — NEW) — Pending / Approved / Rejected states
- [ ] **Loan Repayment Tracker** (LN-04 — NEW) — Active loan summary, schedule, payment history, next due date
- [ ] **Credit Report Preview** (LN-05 — NEW) — Formatted report, share button (PDF export)

**Phase 8 Screens Delivered:** LN-01 through LN-05
**Phase 8 Deliverables:**
- Full loan application flow
- Repayment tracking
- Shareable credit report PDF
- Loan history feeding back into Trust Score

---

## Phase 9 — Optimization, Testing & Scale

**Goal:** App is production-ready, performant, tested, and ready to scale.

### 9.1 Performance

- [ ] Implement React Native performance audit (Flipper profiling)
- [ ] Optimize WatermelonDB queries (add indices on `merchant_id`, `recorded_at`)
- [ ] Implement API response caching (Redis) for statistics and predictions endpoints
- [ ] Lazy load heavy screens (Statistics charts)
- [ ] Reduce bundle size: audit and remove unused dependencies
- [ ] Target: app launch < 3s on mid-range Android (e.g., Tecno Spark)

### 9.2 Testing

- [ ] **Unit tests (backend):** pytest — all service layer functions
- [ ] **Unit tests (mobile):** Jest + React Native Testing Library — all hooks and utility functions
- [ ] **Integration tests (backend):** Full API endpoint tests with test database
- [ ] **E2E tests (mobile):** Detox — critical flows:
  - Register → Onboard → Log first sale
  - Upload receipt → Get result
  - View Trust Score → See breakdown
  - View Statistics → See predictions
- [ ] **AI model tests:** Validate OCR accuracy on sample receipt dataset (target > 85% field extraction accuracy)
- [ ] **Fraud detection tests:** Test against known fake and real receipt samples

### 9.3 Security Audit

- [ ] Penetration test on all API endpoints
- [ ] Validate RLS policies in Supabase — no cross-merchant data leakage possible
- [ ] Review JWT token handling (no tokens in logs, secure storage)
- [ ] Review image upload pipeline for malicious file injection
- [ ] Review Claude API prompt injection risks

### 9.4 Production Deployment

- [ ] Set up CI/CD pipeline (GitHub Actions):
  - On push to `develop`: run tests, deploy to staging
  - On push to `main`: run tests, deploy to production
- [ ] Deploy FastAPI backend to a cloud provider (Railway, Render, or AWS EC2)
- [ ] Configure environment-specific Supabase projects (dev / staging / prod)
- [ ] Set up monitoring: Sentry (errors), PostHog (analytics — anonymized)
- [ ] Configure EAS Build for Android APK and iOS TestFlight
- [ ] Submit to Google Play Store (Android-first for Cameroon market)

### 9.5 AI Model Iteration

- [ ] After 500+ active merchants: retrain XGBoost credit scoring model on real data
- [ ] After 3+ months of data: upgrade from rules-based fallback to full Prophet predictions
- [ ] After 1,000+ verified receipts: evaluate fine-tuning OCR on Cameroonian receipt formats
- [ ] Implement A/B testing framework for model improvements

**Phase 9 Deliverables:**
- All tests passing
- App passes security audit
- Live on Google Play Store
- MILESTONE M3 (POST-LAUNCH) COMPLETE

---

## Full Screen Delivery Tracker

| Phase | Screens Delivered |
|---|---|
| Phase 1 | L-01→L-07, A-01→A-06, D-06 (13 screens) |
| Phase 2 | R-01→R-09, D-01 partial (10 screens) |
| Phase 3 | V-01→V-10 (10 screens) |
| Phase 4 | K-01→K-04, D-05 (5 screens) |
| Phase 5 | T-01→T-03, D-03, D-09 (5 screens) |
| Phase 6 | S-01→S-07 (7 screens) |
| Phase 7 | D-02, D-07, D-08 fully wired (3 screens) |
| Phase 8 | LN-01→LN-05 (5 screens) |
| **Total** | **58 of 65 screens** |

> The remaining 7 screens (D-04 Profile, D-01 homepage fully wired, etc.) are progressively wired throughout phases.

---

## Dependency Map

```
Phase 0 (Setup)
    └── Phase 1 (Auth + Navigation)
            └── Phase 2 (Records)
            │       └── Phase 5 (Trust Score) ──────┐
            │       └── Phase 6 (Statistics)         │
            └── Phase 3 (Receipt Verification)        │
            │       └── Phase 5 (Trust Score) ──────┤
            └── Phase 4 (KYC)                        │
                    └── Phase 5 (Trust Score) ───────┘
                                │
                        Phase 7 (AI Insights + Polish)
                                │
                        Phase 8 (Loan Module)
                                │
                        Phase 9 (Optimization + Launch)
```

> Phases 2, 3, and 4 can be developed in parallel by separate workstreams after Phase 1 is complete.
> Phase 5 cannot start until Phases 2, 3, and 4 are all complete (needs data from all three).

---

## Technology Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Mobile framework | React Native + Expo Managed | Cross-platform, Expo handles camera/storage/notifications, fastest to MVP |
| UI styling | NativeWind | Tailwind maps cleanly to Figma designs, consistent with web ecosystem |
| Navigation | expo-router v3 | File-based routing, cleaner than React Navigation for this app's complexity |
| Offline storage | WatermelonDB | Best React Native offline-first DB, built-in sync capabilities |
| Backend | FastAPI (Python) | Python-native AI/ML libraries, async, fast |
| Database | PostgreSQL via Supabase | Free tier, built-in RLS, Storage, Auth helpers |
| Credit scoring | XGBoost | Interpretable, handles sparse data, fast inference |
| Time-series predictions | Prophet | Battle-tested for business forecasting, handles seasonality |
| OCR | EasyOCR | Open source, self-hosted, supports French text |
| AI insights | Claude API (haiku-4-5) | Cost-efficient for frequent calls, excellent French support |
| SMS/OTP | Africa's Talking | Best Cameroon coverage and pricing |
| State management | Zustand | Lightweight, offline-aware, no boilerplate |

---

## Open Questions (Resolve Before Phase Start)

| # | Question | Needed By |
|---|---|---|
| Q1 | Will KYC verification be automated only, or will there be a human review queue for borderline cases? | Phase 4 |
| Q2 | Who are the target MFI partners for the loan module? Do they have an API, or is the credit report a PDF export only? | Phase 8 |
| Q3 | What is the target initial loan amount range (e.g., 50,000 – 500,000 FCFA)? | Phase 8 |
| Q4 | Will the app be Android-only at launch or simultaneous iOS? | Phase 9 |
| Q5 | Is there a plan for a merchant referral/network feature that could add social trust signals to the scoring model? | Phase 5 |
| Q6 | Will the anonymized data used for AI training require an explicit opt-in toggle (beyond the general Privacy & Consent)? | Phase 0 |
