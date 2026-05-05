# UI/UX Specification
# MboaTrust AI — Mobile Application

**Version:** 2.0
**Date:** 2026-04-06
**Status:** Updated — all existing screens catalogued; all missing and new screens identified

---

## 1. Design System

### 1.1 Colors
| Token | Value | Usage |
|---|---|---|
| Primary | #1A5C3A (deep green) | Buttons, active states, Trust Score ring |
| Secondary | #F5F0E8 (warm off-white) | Backgrounds, cards |
| Accent | #4CAF7D (medium green) | Success states, progress bars |
| Warning | #F59E0B (amber) | Caution states, pending |
| Danger | #EF4444 (red) | Suspicious/error states |
| Neutral | #6B7280 (gray) | Secondary text, inactive icons |
| Text Primary | #1F2937 | Main body text |
| Text Light | #FFFFFF | Text on dark backgrounds |

### 1.2 Typography
- Primary font: System default (SF Pro on iOS, Roboto on Android)
- Numbers / scores: Bold, large sizing
- All strings externalized for i18n (English / Français / Pidgin)

### 1.3 Bottom Navigation (5 Tabs)
| Tab | Icon | Screen |
|---|---|---|
| Home | House | Homepage |
| Verify | Shield checkmark | Receipt Verification Hub |
| Records | Receipt / list | Records Overview |
| Statistics | Bar chart (NEW) | Statistics Overview |
| Profile | Person | Trust Score Details |

> Note: Previously 4 tabs. Statistics replaces or is added alongside the existing Insights tab. Final tab count = 5.

### 1.4 Offline Indicator
A persistent banner appears at the top of all screens when the device is offline: `"Working Offline — Syncing when connected"`

---

## 2. Screen Inventory — Complete

### STATUS KEY
- ✅ Designed — image exists in /UI directory
- ❌ Not designed — needs to be created
- 🔄 Redesign needed — existing design requires modification

---

### 2.1 Landing Section

| # | Screen | Status | Notes |
|---|---|---|---|
| L-01 | Splash Screen | ✅ | MboaTrust AI logo, tagline, offline indicator |
| L-02 | Welcome Step 1 | ✅ | Value prop, feature highlights |
| L-03 | Welcome Step 2 | ❌ | Needs to be designed — second onboarding step |
| L-04 | Welcome Step 3 | ❌ | Needs to be designed — third onboarding step |
| L-05 | Onboarding: Trust Score | ✅ | Score = 85, Loan Eligibility |
| L-06 | Onboarding: Track Records (Profit) | ✅ | Sales/expense tracking preview |
| L-07 | Onboarding: Verify Payments (Stop Fakes) | ✅ | Receipt verification preview — copy needs update to reflect new feature purpose |

---

### 2.2 Auth Section

| # | Screen | Status | Notes |
|---|---|---|---|
| A-01 | Login | ✅ | Phone number + PIN |
| A-02 | Merchant Registration | ✅ | Name, phone, business category, PIN |
| A-03 | Forgot Password | ✅ | Phone number entry, send OTP |
| A-04 | Privacy & Consent | ✅ | Screenshot analysis, usage data toggles — update copy for new receipt feature |
| A-05 | OTP Verify Identity | ✅ | 6-digit code, 5-min expiry |
| A-06 | Reset PIN (New PIN Entry) | ❌ | Screen after OTP verified in forgot-password flow |

---

### 2.3 KYC Section (NEW)

| # | Screen | Status | Notes |
|---|---|---|---|
| K-01 | KYC Introduction / Prompt | ❌ | Post-registration: "Complete your profile to boost your score" |
| K-02 | National ID Upload | ❌ | Front + back photo, OCR extraction confirmation |
| K-03 | RCCM Business Registration Upload | ❌ | Optional, adds +5 to score |
| K-04 | KYC Verification Status | ❌ | Shows badge status: Verified / Pending / Not Started |

---

### 2.4 Dashboard Section

| # | Screen | Status | Notes |
|---|---|---|---|
| D-01 | Homepage | ✅ | Today's sales, score ring, quick actions, recent activity, AI insight |
| D-02 | AI Insights & Alerts | ✅ | Unusual transaction, restock advice, weekly summary, Trust Level |
| D-03 | Notifications | ✅ | Activity stream — score updates, alerts, summaries |
| D-04 | Profile & Settings | ✅ | Business info, toggles, language, log out |
| D-05 | Edit Profile | ❌ | Full editable profile form |
| D-06 | Language Selection | ✅ | English / Français / Pidgin |
| D-07 | Offline Mode Status | ✅ | No internet banner, pending sync count |
| D-08 | Help & Tutorial | ✅ | Search, video, Trust Score guide, live chat |
| D-09 | Credit Score Breakdown | ❌ | Score split by 6 factor categories with explanations |

---

### 2.5 Receipt Verification Section (REVISED)

> **All screens in this section reflect the revised purpose: merchant uploads their own purchase receipts, not customer payment screenshots.**

| # | Screen | Status | Notes |
|---|---|---|---|
| V-01 | Verification Hub | ✅ | Redesign copy: "Verify Your Receipts" instead of "Verify Payment Screenshot." Options: Upload Screenshot, Take Photo, Manual Entry |
| V-02 | Capture Receipt | 🔄 | Currently "Capture Payment Screenshot" — needs copy change to "Upload Your Purchase Receipt" |
| V-03 | Result: Authentic | ❌ | New result state for verified supplier receipt — show: supplier name, amount, date, score contribution |
| V-04 | Result: Suspicious | 🔄 | Exists as "Suspicious Payment" — update copy and risk factors for receipt forgery context |
| V-05 | Result: Pending | ✅ | Reusable — processing state |
| V-06 | Result: Looks Confirmed (retire/repurpose) | 🔄 | Original was for customer payments — repurpose as "Authentic" result or retire |
| V-07 | Receipt Detail View | ❌ | Full parsed receipt: supplier, amount, items, date, verification status, score contribution |
| V-08 | Manual Entry | ❌ | Form: supplier name, amount, date, items — lower score weight, clearly labeled |
| V-09 | Verification History (filled state) | ❌ | List of past verifications with status badges |
| V-10 | Verification History (empty state) | ✅ | "No sales recorded yet" — update copy to "No receipts verified yet" |

---

### 2.6 Records Section

| # | Screen | Status | Notes |
|---|---|---|---|
| R-01 | Records Overview Hub | ❌ | Tab landing: Sales / Expenses / Stock cards with totals + quick add buttons |
| R-02 | Add Sale | 🔄 | Add optional Customer Tag field |
| R-03 | Sales History | ✅ | Chronological list, AI Performance Pulse |
| R-04 | Add Expense | ✅ | Amount, category, date, notes |
| R-05 | Expense History | ❌ | Chronological expense list with category filters |
| R-06 | Add Stock Purchase | 🔄 | Add Supplier Name field (required for credit scoring) |
| R-07 | Stock / Purchase History | ❌ | Chronological list of stock purchases |
| R-08 | Supplier Directory | ❌ | List of all suppliers the merchant has used |
| R-09 | Success: Record Saved | ✅ | Confirmation screen — reusable across all record types |

---

### 2.7 Trust Score Section

| # | Screen | Status | Notes |
|---|---|---|---|
| T-01 | Merchant Trust Score Details | ✅ | Score ring, status, tips, trend chart, next milestone |
| T-02 | Credit Score Breakdown | ❌ | 6-category bar breakdown, improving/hurting factors (also in Dashboard section D-09) |
| T-03 | Financial Summary | ✅ | Health overview, AI health check, sales/expenses, expense breakdown |
| T-04 | AI Insights & Alerts | ✅ | (Shared with Dashboard D-02) |

---

### 2.8 Statistics Section (NEW)

| # | Screen | Status | Notes |
|---|---|---|---|
| S-01 | Statistics Overview | ❌ | Timeframe toggle (Weekly/Monthly/Annual), summary cards, chart preview |
| S-02 | Weekly Statistics Detail | ❌ | Day-by-day bar chart, weekly totals, vs previous week |
| S-03 | Monthly Statistics Detail | ❌ | Week-by-week chart, expense donut, health ratio, monthly AI summary |
| S-04 | Annual Statistics Detail | ❌ | 12-month line chart, year totals, Trust Score progression, annual AI summary |
| S-05 | AI Predictions Dashboard | ❌ | Grid of prediction cards with icons, headlines, confidence badges |
| S-06 | Prediction Detail View | ❌ | Full prediction: data basis, confidence, recommended action, reminder button |
| S-07 | Not Enough Data Yet | ❌ | Empty/early state for Statistics — tips to add records |

---

### 2.9 Loan Module Section (Planned — Post-Launch)

| # | Screen | Status | Notes |
|---|---|---|---|
| LN-01 | Loan Eligibility Introduction | ❌ | Unlocked when score ≥ 70 |
| LN-02 | Loan Application | ❌ | Amount selector, repayment preview, required docs |
| LN-03 | Loan Application Status | ❌ | Pending / Approved / Rejected states |
| LN-04 | Loan Repayment Tracker | ❌ | Active loan, schedule, payment history |
| LN-05 | Credit Report Preview | ❌ | Shareable report for MFI partners |

---

## 3. Summary: Screen Counts

| Status | Count |
|---|---|
| ✅ Designed (present in /UI folder) | 30 |
| 🔄 Needs redesign / copy update | 6 |
| ❌ Not yet designed | 29 |
| **Total screens in full spec** | **65** |

---

## 4. Screen Modification Details

### V-01 — Verification Hub (copy update)
- **Change:** Replace "Verify Every CFA With AI Precision" headline
- **New headline:** "Verify Your Purchase Receipts"
- **New subtext:** "Upload receipts from your suppliers to build your verified purchasing history and boost your Trust Score."
- **Options remain:** Upload Screenshot, Take Photo, Manual Entry

### V-02 — Capture Receipt (copy update)
- **Change:** Replace "Verify Payment Screenshot" with "Upload Your Purchase Receipt"
- **New subtext:** "Upload a receipt from a supplier or wholesaler. Supported formats: photo, screenshot, or PDF."
- **Remove:** Customer-facing payment verification copy

### A-04 — Privacy & Consent (copy update)
- **Change:** Screenshot analysis section should specify: "We analyze purchase receipts you upload — not customer payments. Your receipts are processed to verify authenticity and are deleted after verification."

### L-07 — Onboarding: Verify Payments (copy update)
- **Change:** Headline "Stop Fake Payments" no longer applies
- **New headline:** "Prove Your Business"
- **New body:** "Upload purchase receipts from your suppliers. Our AI verifies them to build your purchasing history and unlock better credit scores."

### R-02 — Add Sale (field addition)
- **Change:** Add optional "Customer Tag" field at bottom of form
- **Label:** "Customer (Optional)" — free text or select from previous tags
- **Note shown:** "Tracking customers improves your Trust Score"

### R-06 — Add Stock Purchase (field addition)
- **Change:** Make "Supplier Name" a required field
- **Autocomplete:** Suggest from previously entered supplier names
- **Note shown:** "Supplier name is used to verify your purchasing history"

---

## 5. User Flow Diagrams

### 5.1 Receipt Verification Flow (Revised)

```
Merchant wants to record a purchase receipt
    │
    ▼
Verification Hub (V-01)
    │
    ├─ Take Photo → Camera (V-02) → AI Processing → Result
    ├─ Upload from Gallery → Gallery Picker → AI Processing → Result
    └─ Manual Entry → Manual Entry Form (V-08) → Saved (lower weight)
                                                      │
                                           AI Result: AUTHENTIC (V-03)
                                                      │→ Save to Purchasing History
                                                      │→ Update Trust Score
                                                      │
                                           AI Result: SUSPICIOUS (V-04)
                                                      │→ Show risk factors
                                                      │→ NOT added to score
                                                      │
                                           AI Result: PENDING (V-05)
                                                      │→ Queued for processing
                                                      │→ Notify when done
```

### 5.2 Trust Score Build Flow

```
New Merchant Registers
    │
    ├─ Complete Profile → +KYC Points
    ├─ Add Sales Records → +Business Activity Points
    ├─ Add Expense Records → +Cash Flow Points
    ├─ Upload Verified Receipts → +Purchasing Power Points
    ├─ Log Stock Purchases → +Supply Chain Points
    └─ Consistent App Usage → +Behavior Points
                │
                ▼
          Trust Score Updates
                │
                ▼
        Score ≥ 70 → Loan Eligible
```

### 5.3 Statistics & Predictions Flow

```
Statistics Tab (S-01)
    │
    ├─ Weekly View (S-02)
    ├─ Monthly View (S-03)
    └─ Annual View (S-04)
    │
    └─ AI Predictions Dashboard (S-05)
           │
           └─ Prediction Detail (S-06)
                  │
                  └─ Set Reminder → Push Notification scheduled
```
