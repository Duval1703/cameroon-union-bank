# MboaTrust AI — Project Context & Change Log

---

## Project Overview

**MboaTrust AI** is an AI-powered mobile application built for Cameroonian merchants and traders operating in the informal and semi-formal commerce sector. It addresses three core problems:

1. **No Financial Identity** — Informal merchants have no verifiable financial history, blocking access to credit.
2. **No Structured Records** — Most small business owners have no bookkeeping system.
3. **Fake Payment Fraud** — Merchants receive fraudulent MTN Mobile Money and Orange Money screenshots from customers.

The app solves these by letting merchants log business activity, verify payment and purchase receipts, build a Trust Score from verified data, access AI-powered business insights, and eventually qualify for microloans — all from a mobile phone.

**Target Users:** Cameroonian marketplace merchants, small shop owners, wholesale/retail traders, import/export dealers.
**Languages:** English, Français, Pidgin.
**Connectivity:** Fully offline-capable — records sync when network is restored.
**Tagline:** *"Building the Digital Health for Cameroon"*

---

## Core Features

### 1. Receipt Verification (REVISED — see Change Log 2026-04-06)
**Original purpose:** Merchants upload customer payment screenshots to detect fake MTN/Orange Money payments sent by customers.

**Revised purpose:** Merchants upload their **own purchase receipts** (from suppliers, wholesalers, markets) to prove business activity. The AI verifies the authenticity of these receipts using OCR, image forensics, and cross-validation against the merchant's own sales and expense records. Verified receipts build purchasing power evidence that feeds directly into the credit scoring model. The fake customer payment detection feature is removed.

### 2. Business Record Keeping
Merchants log sales, expenses, and stock purchases directly in the app. Records are timestamped, AI-categorized, and stored locally (offline-first) then synced to the cloud.

### 3. Trust Score & Credit Scoring
A 0–100 score generated from 6 factor categories (see Credit Scoring Specification). Determines loan eligibility and builds the merchant's digital financial identity. Score updates in real time as new verified data is added.

### 4. Statistics & AI Predictions (NEW — see Change Log 2026-04-06)
A dedicated statistics section showing weekly, monthly, and annual business performance. The underlying data trains an AI prediction engine that forecasts sales, cash flow risk, restock needs, and more.

### 5. AI Business Insights
Claude API-powered plain-language insights, alerts, and recommendations delivered on the dashboard and insights page.

### 6. Loan Module (Planned — post-launch)
Merchants with a qualifying Trust Score can apply for microloans directly in the app. Repayment is tracked in-app and feeds back into the credit score.

---

## UI Screens Inventory

### Present ✅ (30 screens)

| Section | Screen |
|---|---|
| Landing | Splash Screen |
| Landing | Welcome Step 1 |
| Landing | Onboarding: Trust Score |
| Landing | Onboarding: Track Records |
| Landing | Onboarding: Verify Payments |
| Auth | Login |
| Auth | Merchant Registration |
| Auth | Forgot Password |
| Auth | Privacy & Consent |
| OTP | Verify Identity |
| Dashboard | Homepage |
| Dashboard | AI Insights & Alerts |
| Dashboard | Notifications |
| Dashboard | Profile & Settings |
| Dashboard | Language Selection |
| Dashboard | Offline Mode Status |
| Dashboard | Help & Tutorial |
| Trust Score | Merchant Trust Score Details |
| Trust Score | Financial Summary |
| Trust Score | Verification Hub |
| Trust Score | Add Sale |
| Trust Score | Add Expense |
| Trust Score | Add Stock Purchase |
| Trust Score | Sales History |
| Trust Score | Success: Record Saved |
| Bill Verification | Capture Payment |
| Bill Verification | Result: Looks Confirmed |
| Bill Verification | Result: Suspicious |
| Bill Verification | Result: Pending |
| Bill Verification | Empty State: History |

---

### Missing — Previously Identified ❌

| Section | Missing Screen |
|---|---|
| Auth | New PIN / Reset PIN screen (after OTP in password reset) |
| Landing | Welcome Steps 2 & 3 (only Step 1 exists) |
| Records | Expense History |
| Records | Stock / Purchase History |
| Records | Records Overview (tab landing hub) |
| Bill Verification | Verification History — filled state |
| Bill Verification | Manual Entry screen |
| Trust Score | Loan / Credit Application flow |
| Dashboard | Edit Profile screen |

---

### New Screens Required — From Feature Changes ❌ (2026-04-06)

| Section | New Screen | Reason |
|---|---|---|
| Bill Verification | Redesigned "Upload Receipt" screen | Old screen was for customer payment screenshots; new flow is merchant uploading their own purchase receipts |
| Bill Verification | Receipt Verification Result: Authentic | New result state for verified supplier receipt |
| Bill Verification | Receipt Verification Result: Forged/Suspicious | New result state for suspicious supplier receipt |
| Bill Verification | Receipt Detail View | Full parsed receipt data: amount, supplier, date, items |
| KYC / Verification | National ID Upload screen | KYC depth — upload front + back of national ID |
| KYC / Verification | RCCM Business Registration Upload | Optional business registration doc upload |
| KYC / Verification | KYC Verification Status screen | Shows verification badge status |
| Records — Add Sale | Customer Tag field (modification) | Add optional customer label to sales records |
| Records — Add Stock | Supplier Name field (modification) | Add supplier name to stock purchase records |
| Records | Supplier History / Directory | List of merchant's recurring suppliers |
| Statistics | Statistics Overview screen | Weekly/Monthly/Annual selector with charts |
| Statistics | Weekly Statistics Detail | Detailed weekly breakdown |
| Statistics | Monthly Statistics Detail | Detailed monthly breakdown |
| Statistics | Annual Statistics Detail | Annual review with year-over-year comparison |
| Statistics | AI Predictions Dashboard | Forecasts: sales, cash flow, restock, loan capacity |
| Statistics | Prediction Detail View | Expanded view of a single AI prediction |
| Dashboard | Credit Score Breakdown screen | Score broken down by the 6 factor categories |
| Loan Module | Loan Application screen | Apply for microloan based on Trust Score |
| Loan Module | Loan Status / Repayment Tracker | Track active loan + repayment schedule |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo (Managed Workflow) |
| UI Styling | NativeWind (Tailwind for React Native) |
| Navigation | React Navigation v6 (stack + bottom tabs) |
| Offline Storage | WatermelonDB (SQLite-backed, offline-first sync) |
| Backend | Python + FastAPI |
| Cloud Database | PostgreSQL via Supabase |
| AI — OCR | EasyOCR (receipt text extraction) |
| AI — Fraud Detection | Custom image forensics model + cross-validation logic |
| AI — Credit Scoring | XGBoost / Gradient Boosting model |
| AI — Predictions | Time-series model (Prophet or LSTM) |
| AI — Insights | Claude API (claude-haiku-4-5 for cost efficiency) |
| Auth / OTP | Africa's Talking (Cameroon SMS coverage) |
| Secure Storage | expo-secure-store (PIN storage) |
| Push Notifications | Expo Notifications + Africa's Talking SMS |
| Camera / Image | expo-camera + expo-image-picker |

---

## Credit Scoring Model Summary

**Score range:** 0–100. Updated in real time as new data is added.

| Factor Category | Weight | App Coverage |
|---|---|---|
| Business Activity & Revenue | 25% | ✅ Sales records |
| Purchase & Receipt Verification | 20% | 🔄 Being revised |
| Expense & Cash Flow Management | 15% | ✅ Expense records |
| App Behavior Signals | 15% | ⚠️ Backend tracking needed |
| Identity & KYC | 15% | ⚠️ Partial — needs National ID / RCCM |
| Loan Repayment History | 10% | ❌ Loan module not yet built |

See `Credit_Scoring_Specification.md` for full detail.

---

## Statistics & AI Predictions Summary

**Statistics page** will display business performance across three timeframes: weekly, monthly, annual.

**AI Predictions (trained on merchant data):**

| Prediction | Description |
|---|---|
| Sales Forecast | Projected revenue for next 7 / 30 days |
| Restock Timing | When specific stock items will run out |
| Cash Flow Warning | Predicted shortfall dates |
| Slow Period Detection | Seasonal low-sales periods |
| Expense Creep Alert | Category costs growing unsustainably |
| Loan Repayment Capacity | Can the merchant repay a given loan amount? |
| Business Health Trajectory | Growth / stable / declining trend |

See `Statistics_and_Predictions_Specification.md` for full detail.

---

## Change Log

### 2026-04-06

| # | Action | Details |
|---|---|---|
| 1 | Project initialized | Created project.md, catalogued all 30 existing UI screens, identified 9 missing screens |
| 2 | Receipt Verification — purpose revised | Feature repurposed from detecting fake customer payments → to merchant uploading own purchase receipts for credit scoring evidence |
| 3 | Credit Scoring model defined | 6-factor model documented with weights, AI pipeline, fraud detection strategy, and implementation gaps |
| 4 | Statistics & Predictions feature added | New app section: weekly/monthly/annual stats + 7 AI predictions |
| 5 | New UI screens identified | 19 new screens required from feature changes and additions |
| 6 | Tech stack finalized | React Native + Expo / FastAPI / PostgreSQL+Supabase / WatermelonDB / XGBoost / Claude API |
| 7 | Documentation updated | All documentation recreated as .md files (originals were unreadable binary/PDF) |
| 8 | Implementation plan drafted | 9-phase plan covering full project from setup to post-launch, saved as Implementation_Plan.md |

---

## Daily Summary

### 2026-04-06
- Full project analysis completed from UI image review (30 screens catalogued).
- Major feature pivot: Receipt Verification repurposed from customer fraud detection to merchant purchase proof for credit scoring.
- Comprehensive credit scoring model defined across 6 factor categories with AI pipeline.
- New Statistics & AI Predictions section defined with 7 predictable metrics.
- 19 new UI screens identified as required.
- Tech stack finalized: React Native + Expo frontend, FastAPI backend, XGBoost credit model, Claude API for insights.
- All documentation recreated as authoritative .md files.
- Implementation plan drafted and saved as `Implementation_Plan.md` — 9 phases, 3 milestones, 65 screens tracked.
- No code written yet — implementation plan awaiting user approval before execution begins.
