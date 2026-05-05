# Software Requirements Specification (SRS)
# MboaTrust AI — Mobile Application

**Version:** 2.0
**Date:** 2026-04-06
**Status:** Updated — reflects all feature revisions as of 2026-04-06

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for MboaTrust AI, an AI-powered mobile application targeting Cameroonian merchants in the informal and semi-formal commerce sector.

### 1.2 Scope
MboaTrust AI enables merchants to:
- Log and verify business transactions (sales, expenses, stock purchases)
- Upload and verify their own purchase receipts to build a verified financial history
- Build a Trust Score (0–100) used for credit eligibility
- Access AI-driven business insights and predictions
- View statistical analysis of their business performance
- Apply for microloans based on their Trust Score (post-launch phase)

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Merchant | A Cameroonian small business owner / trader using the app |
| Trust Score | A 0–100 numerical score representing the merchant's financial reliability |
| Receipt Verification | The process of uploading and AI-verifying a purchase receipt submitted by the merchant |
| KYC | Know Your Customer — identity verification process |
| RCCM | Registre du Commerce et du Crédit Mobilier — Cameroonian business registration |
| MFI | Microfinance Institution — potential loan partner |
| FCFA / XAF | Central African CFA franc — local currency |

### 1.4 Stakeholders
| Stakeholder | Role |
|---|---|
| Merchants | Primary users — log records, get scores, access insights |
| MboaTrust AI Team | Product owners, developers, data scientists |
| Microfinance Institutions (MFIs) | Potential partners consuming Trust Score reports |
| Suppliers / Wholesalers | Indirect stakeholders — named in merchant records |

---

## 2. System Overview

### 2.1 Product Description
MboaTrust AI is a cross-platform mobile application (iOS + Android) built with React Native + Expo. It functions offline-first, stores data locally via WatermelonDB, and syncs to a PostgreSQL cloud database when connectivity is available. AI processing (OCR, fraud detection, scoring, predictions) runs on the FastAPI backend.

### 2.2 Key Design Principles
- **Offline-first:** All core features work without internet. Data syncs automatically when online.
- **Simple UX:** Designed for merchants with limited digital literacy.
- **Multi-language:** English, Français, Pidgin supported.
- **AI-assisted, human-verified:** AI makes recommendations and flags anomalies; merchants always see explanations.
- **Privacy-respecting:** Minimal data collection with explicit user consent.

---

## 3. Functional Requirements

### 3.1 Landing & Onboarding

| ID | Requirement |
|---|---|
| F-LND-01 | The app SHALL display a splash screen on launch showing the MboaTrust AI logo and tagline |
| F-LND-02 | The app SHALL present a multi-step welcome/onboarding flow (minimum 3 steps) explaining: Trust Score, Record Tracking, and Receipt Verification |
| F-LND-03 | Users SHALL be able to skip onboarding after Step 1 |
| F-LND-04 | The onboarding SHALL be shown only on first launch |

---

### 3.2 Authentication & Registration

| ID | Requirement |
|---|---|
| F-AUTH-01 | Merchants SHALL register using: Full Name, Phone Number, Business Category, Security PIN |
| F-AUTH-02 | Login SHALL use Phone Number + PIN |
| F-AUTH-03 | Forgot Password flow SHALL send an OTP via SMS to the registered phone number |
| F-AUTH-04 | After OTP verification, the merchant SHALL be prompted to set a new PIN |
| F-AUTH-05 | PIN SHALL be stored securely using device-level encryption (expo-secure-store) |
| F-AUTH-06 | The app SHALL present a Privacy & Consent screen before completing registration, detailing what data is collected and why |
| F-AUTH-07 | Merchant SHALL explicitly grant consent for screenshot analysis and usage data collection |

---

### 3.3 KYC — Identity & Business Verification

| ID | Requirement |
|---|---|
| F-KYC-01 | After registration, the merchant MAY complete enhanced KYC to improve their Trust Score |
| F-KYC-02 | KYC SHALL support upload of National ID (front and back photo) |
| F-KYC-03 | KYC SHALL support optional upload of RCCM business registration document |
| F-KYC-04 | The AI SHALL use OCR to extract name and ID number from the National ID and cross-validate against the registration name |
| F-KYC-05 | Verified KYC status SHALL be displayed as a badge on the merchant's profile |
| F-KYC-06 | KYC verification status SHALL contribute 15% weight to the Trust Score |

---

### 3.4 Dashboard & Home

| ID | Requirement |
|---|---|
| F-DASH-01 | The homepage SHALL display: today's sales total, Trust Score ring, Quick Actions (Check Payment, Add Sale, Add Expense), Recent Activity list, AI Business Insight |
| F-DASH-02 | The AI Business Insight on the homepage SHALL refresh daily using the Claude API |
| F-DASH-03 | The app SHALL display an offline banner when no internet is detected |
| F-DASH-04 | The Notifications screen SHALL aggregate: fraud alerts, Trust Score changes, AI recommendations, security events |
| F-DASH-05 | Language selection (English / Français / Pidgin) SHALL be accessible from the homepage and settings |
| F-DASH-06 | The Help & Tutorial screen SHALL include: searchable FAQ, video tutorial, Trust Score explanation, live chat support |

---

### 3.5 Record Keeping

#### 3.5.1 Sales

| ID | Requirement |
|---|---|
| F-REC-01 | Merchants SHALL be able to log a sale with: Amount (FCFA/XAF), Payment Method (Cash / Mobile Money), Date & Time, Category (AI-predicted), Customer Tag (optional), Notes |
| F-REC-02 | The AI SHALL automatically predict the sale category based on amount and time patterns |
| F-REC-03 | The app SHALL display a Sales History screen with chronological list, searchable by customer or date |
| F-REC-04 | Sales History SHALL display an AI Performance Pulse summary at the bottom |

#### 3.5.2 Expenses

| ID | Requirement |
|---|---|
| F-REC-05 | Merchants SHALL be able to log an expense with: Amount, Category (Rent / Transport / Supplies / Others), Date & Time, Notes, Optional receipt image |
| F-REC-06 | The app SHALL display an Expense History screen with chronological list and category filters |

#### 3.5.3 Stock Purchases

| ID | Requirement |
|---|---|
| F-REC-07 | Merchants SHALL be able to log a stock purchase with: Item Name, Amount, Purchase Date, Supplier Name (new — required for credit scoring), AI-suggested category |
| F-REC-08 | The app SHALL display a Stock / Purchase History screen |
| F-REC-09 | Stock entries SHALL include a Trust Score readiness indicator showing whether the entry is eligible for credit scoring |

#### 3.5.4 Records Overview

| ID | Requirement |
|---|---|
| F-REC-10 | The Records tab SHALL have an overview/hub page listing: Sales, Expenses, Stock — with totals and quick-add buttons |
| F-REC-11 | All record types SHALL be available offline, stored locally, and synced on reconnection |

---

### 3.6 Receipt Verification (REVISED 2026-04-06)

> **Note:** This feature has been redesigned. It is no longer used to detect fake customer payments. It is now used by the merchant to upload and verify their own purchase receipts, building a verified purchasing history for credit scoring.

| ID | Requirement |
|---|---|
| F-VER-01 | Merchants SHALL be able to upload a purchase receipt via: camera photo, gallery image, or manual data entry |
| F-VER-02 | The AI SHALL perform OCR on the uploaded receipt image to extract: supplier name, amount, date, items purchased |
| F-VER-03 | The AI SHALL perform image forensics to detect: digital manipulation, metadata inconsistencies, template reuse, resolution anomalies |
| F-VER-04 | The AI SHALL cross-validate receipt data against the merchant's existing records: Does the supplier name match previously used suppliers? Does the amount match the business scale? Is the date consistent with purchase history? |
| F-VER-05 | The system SHALL return one of three verification results: Authentic, Suspicious, or Pending (when further analysis is needed) |
| F-VER-06 | Authentic receipts SHALL be stored in the verified purchasing history and contribute to the Trust Score |
| F-VER-07 | Suspicious receipt results SHALL display specific risk factors detected, and SHALL NOT be added to the credit record |
| F-VER-08 | The merchant SHALL be able to view a Receipt Detail screen showing: parsed data, verification status, contribution to Trust Score |
| F-VER-09 | The app SHALL maintain a Verification History list (both filled and empty states) |
| F-VER-10 | Manual entry verification SHALL allow the merchant to enter receipt data without an image, with lower credit score weight assigned |

---

### 3.7 Trust Score

| ID | Requirement |
|---|---|
| F-SCR-01 | The Trust Score SHALL range from 0 to 100 |
| F-SCR-02 | The score SHALL be calculated from 6 factor categories with defined weights (see Credit Scoring Specification) |
| F-SCR-03 | The Trust Score Details screen SHALL show: score ring, status label, improvement tips, score trend chart (6 months), next milestone |
| F-SCR-04 | The Credit Score Breakdown screen SHALL show: score contribution per category, what's helping, what's hurting |
| F-SCR-05 | The AI SHALL generate plain-language explanations for score changes using the Claude API |
| F-SCR-06 | Score SHALL update in real time when new verified data is added |

---

### 3.8 Statistics & AI Predictions (NEW — 2026-04-06)

| ID | Requirement |
|---|---|
| F-STAT-01 | The app SHALL include a dedicated Statistics section accessible from the bottom navigation |
| F-STAT-02 | The Statistics Overview screen SHALL allow switching between Weekly, Monthly, and Annual views |
| F-STAT-03 | Each statistics view SHALL display: total sales, total expenses, net profit, top categories, growth vs previous period |
| F-STAT-04 | Monthly and Annual views SHALL include comparative charts (bar/line) |
| F-STAT-05 | Merchant business data SHALL be used (anonymized and aggregated) to train the AI prediction engine |
| F-STAT-06 | The AI Predictions Dashboard SHALL display active predictions with confidence levels |
| F-STAT-07 | The system SHALL generate the following predictions when sufficient data is available (minimum 4 weeks): |
| | — Sales Forecast: projected revenue for next 7 / 30 days |
| | — Restock Timing: estimated stock depletion date per item |
| | — Cash Flow Warning: predicted cash shortfall date |
| | — Slow Period Detection: upcoming low-sales periods based on historical patterns |
| | — Expense Creep Alert: expense categories growing unsustainably |
| | — Loan Repayment Capacity: whether the merchant can service a given loan amount |
| | — Business Health Trajectory: growth / stable / declining classification |
| F-STAT-08 | Each prediction SHALL have a detail view with: confidence %, data basis, recommended action |
| F-STAT-09 | For new merchants (under 4 weeks of data), the Statistics page SHALL use rules-based logic for early estimates until sufficient ML training data exists |

---

### 3.9 Financial Summary

| ID | Requirement |
|---|---|
| F-FIN-01 | The Financial Summary screen SHALL display: Estimated Profit, AI Health Check rating, Total Sales, Total Expenses, Expense Breakdown by category |
| F-FIN-02 | The AI Health Check SHALL compare the merchant's expense-to-revenue ratio against category benchmarks |
| F-FIN-03 | Financial Summary SHALL support Daily / Weekly / Monthly timeframe toggle |

---

### 3.10 Loan Module (Planned — Post-Launch)

| ID | Requirement |
|---|---|
| F-LOAN-01 | Merchants with a Trust Score of 60+ SHALL be eligible to apply for a microloan |
| F-LOAN-02 | The Loan Application screen SHALL show: eligible amount range, estimated repayment schedule, required documents |
| F-LOAN-03 | Loan repayment SHALL be tracked in-app with scheduled payment reminders |
| F-LOAN-04 | On-time repayments SHALL increase the Trust Score; missed payments SHALL decrease it |

---

### 3.11 Offline Mode

| ID | Requirement |
|---|---|
| F-OFF-01 | All record entry features SHALL function without internet connectivity |
| F-OFF-02 | The app SHALL display an Offline Mode Status screen when disconnected, showing: number of pending records to sync, recently recorded offline transactions |
| F-OFF-03 | Receipt verification SHALL be queued and processed automatically when connectivity is restored |
| F-OFF-04 | Trust Score updates requiring server computation SHALL be deferred until online |

---

### 3.12 Notifications & Alerts

| ID | Requirement |
|---|---|
| F-NOT-01 | The app SHALL send push notifications for: Trust Score changes, Verification results, AI alerts (fraud patterns, restock warnings, cash flow risk) |
| F-NOT-02 | Critical fraud alerts SHALL also be sent via SMS using Africa's Talking |
| F-NOT-03 | The merchant SHALL be able to configure notification preferences in Profile & Settings |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NF-01 | The app SHALL support Android (API 26+) and iOS (14+) |
| NF-02 | App launch time SHALL be under 3 seconds on mid-range Android devices |
| NF-03 | Receipt verification AI processing SHALL return a result within 10 seconds on a standard 3G connection |
| NF-04 | All sensitive data (PIN, personal details) SHALL be encrypted at rest |
| NF-05 | The app SHALL comply with Cameroonian data protection law (Loi n°2010/012) |
| NF-06 | API endpoints SHALL use HTTPS exclusively |
| NF-07 | The offline database SHALL sync without data loss using conflict resolution (last-write-wins with timestamp) |
| NF-08 | The app SHALL support English, Français, and Pidgin — all UI strings SHALL be externalized for localization |
| NF-09 | The credit scoring model SHALL be explainable — every score SHALL have a human-readable breakdown |
| NF-10 | The app SHALL function on devices with as little as 2GB RAM |

---

## 5. Constraints & Assumptions

- Initial deployment targets Android-first due to Cameroon market demographics.
- Internet connectivity is assumed to be intermittent (2G/3G in some areas) — all processing that can be deferred to online must be.
- Receipt verification relies on image quality; merchants will be guided on how to take clear photos.
- The prediction AI requires a minimum of 4 weeks of merchant data before generating reliable forecasts.
- Loan disbursement is out of scope for v1 — the app generates eligibility reports consumed by partner MFIs.
