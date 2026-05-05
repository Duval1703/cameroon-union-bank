# 🏦 CUB Data Collection Agent - Complete System Overview

## ✅ System Status: **FULLY OPERATIONAL**

**Build Date**: April 7, 2026  
**Status**: All components tested and working  
**Test Results**: ✅ PASSED

---

## 📦 What Has Been Built

### **Core Components**

1. **MTN/Orange Money Server Simulator** (`mtn_orange_server.py`)
   - Simulates real mobile money provider APIs
   - Generates realistic transaction data (120 transactions per user)
   - Handles consent management workflow
   - Beautiful mobile-responsive consent UI
   - **Port**: 8000

2. **CUB Data Collection Agent** (`cub_data_agent.py`)
   - Requests transaction data from providers
   - Receives and stores collected data
   - Interactive dashboard with data visualization
   - Real-time updates every 5 seconds
   - **Port**: 8001

3. **Mobile Consent Interface** (embedded in MTN/Orange server)
   - Mobile-optimized design
   - Real-time consent request notifications
   - Approve/Deny functionality
   - Provider-specific branding (MTN yellow, Orange orange)

---

## 🎯 Complete Workflow

```
USER JOURNEY:
1. CUB platform identifies user needing financial data
2. CUB Agent sends request to MTN/Orange server
3. Server creates consent request
4. User receives notification on phone
5. User opens mobile browser → approves request
6. MTN/Orange server generates transaction data (120 transactions)
7. Server POSTs data to CUB Agent webhook
8. CUB Agent stores and displays data
9. Data is ready for AI processing (credit scoring, fraud detection)
```

---

## 📊 Generated Transaction Data

Each approved request generates **realistic financial data**:

### **Data Points Per User:**
- **120 transactions** over 12 months
- **Transaction types**: RECEIVE, SEND, AIRTIME, BILL_PAYMENT, MERCHANT, WITHDRAWAL, DEPOSIT
- **Balance tracking**: Running balance after each transaction
- **Counterparty info**: Phone numbers, agent IDs, merchant names
- **Timestamps**: Distributed realistically over the year
- **Financial summary**: Total received, sent, net balance, average balance

### **Sample Transaction:**
```json
{
  "transaction_id": "MTN-20260407-8a7f3b21",
  "date": "2026-04-07 15:30:45",
  "type": "RECEIVE",
  "amount": 15000,
  "balance_after": 45000,
  "counterparty": "+237699887766",
  "description": "Transfer from Jean"
}
```

---

## 🖥️ How to Use

### **Starting the System**

**Option 1: Automated (Recommended)**
```bash
cd data_collection_agent
./start_servers.sh          # Linux/Mac
# or
start_servers.bat           # Windows
```

**Option 2: Manual**
```bash
# Terminal 1
cd data_collection_agent
python3 mtn_orange_server.py

# Terminal 2
cd data_collection_agent
python3 cub_data_agent.py
```

### **Access Points**

| Interface | URL | Purpose |
|-----------|-----|---------|
| **CUB Dashboard** | http://localhost:8001 | Main control panel |
| **Consent UI (Desktop)** | http://localhost:8000/consent/pending | Testing on same computer |
| **Consent UI (Mobile)** | http://192.168.206.23:8000/consent/pending | Real mobile access |

### **Complete Flow**

1. Open **http://localhost:8001**
2. Enter phone number: `+237670123456`
3. Select provider: `MTN` or `ORANGE`
4. Click **"Request Data Collection"**
5. On phone: Visit **http://192.168.206.23:8000/consent/pending**
6. Click **"✓ Approve"**
7. Data appears in CUB dashboard within 2 seconds

---

## 🧪 Testing

### **Automated Test**
```bash
cd data_collection_agent
python3 test_simulation.py
```

**Output:**
```
✅ ALL TESTS PASSED - System Working Perfectly!
✓ MTN/Orange Server: healthy
✓ CUB Agent: Running
✓ Request created
✓ Found pending requests
✓ Data approved and sent
✓ Total datasets collected: 2
```

### **Manual Test via API**
```bash
# Request data
curl -X POST http://localhost:8001/request-data \
  -H "Content-Type: application/json" \
  -d '{"user_phone": "+237670123456", "provider": "MTN"}'

# Get request ID from response, then approve
curl -X POST http://localhost:8000/consent/{REQUEST_ID}/approve

# View collected data
curl http://localhost:8001/collected-data
```

---

## 📁 File Structure

```
data_collection_agent/
├── mtn_orange_server.py      # MTN/Orange simulator (Port 8000)
├── cub_data_agent.py          # CUB agent (Port 8001)
├── requirements.txt           # Python dependencies
├── start_servers.sh           # Linux/Mac startup script
├── start_servers.bat          # Windows startup script
├── test_simulation.py         # Automated test script
├── README.md                  # System documentation
├── QUICK_START.md            # Quick start guide
├── SYSTEM_OVERVIEW.md        # This file
├── MOBILE_ACCESS.txt         # Mobile access instructions
└── logs/                     # Server logs (auto-created)
```

---

## 🔌 API Reference

### **CUB Agent API (Port 8001)**

#### `GET /`
Dashboard UI - Interactive web interface

#### `POST /request-data`
Request transaction data from provider
```json
{
  "user_phone": "+237670123456",
  "provider": "MTN"
}
```

#### `POST /webhook/data-received`
Webhook for receiving data from provider (called automatically)

#### `GET /collected-data`
Retrieve all collected datasets
```json
{
  "collected_data": [...],
  "total_count": 2
}
```

#### `GET /pending-requests`
View pending data requests

---

### **MTN/Orange Server API (Port 8000)**

#### `POST /api/v1/data-request`
Create new data collection request
```json
{
  "user_phone": "+237670123456",
  "provider": "MTN",
  "callback_url": "http://localhost:8001/webhook/data-received",
  "request_id": "optional-custom-id"
}
```

#### `GET /consent/pending`
Mobile UI for viewing and approving consent requests

#### `POST /consent/{request_id}/approve`
Approve data sharing consent

#### `POST /consent/{request_id}/deny`
Deny data sharing consent

#### `GET /api/v1/consent/list`
List all pending consent requests (JSON)

#### `GET /health`
Health check endpoint

---

## 🎨 Features

### **CUB Dashboard**
- ✅ Request data collection form
- ✅ Real-time pending requests display
- ✅ Collected data visualization
- ✅ Transaction summary cards
- ✅ Individual transaction viewer
- ✅ Full JSON data export
- ✅ Auto-refresh every 5 seconds
- ✅ Mobile-responsive design

### **Consent Interface**
- ✅ Mobile-optimized layout
- ✅ Provider-specific branding
- ✅ One-tap approve/deny
- ✅ Real-time updates
- ✅ Success/error notifications
- ✅ Auto-refresh for new requests

### **Data Generation**
- ✅ 120 realistic transactions per user
- ✅ 7 transaction types
- ✅ Randomized but realistic amounts
- ✅ Proper date distribution (last 12 months)
- ✅ Balance tracking
- ✅ Counterparty information
- ✅ Financial summary statistics

---

## 🔐 Security Features

- ✅ CORS enabled for cross-origin requests
- ✅ Request ID validation
- ✅ Status checking (prevents duplicate processing)
- ✅ Callback URL validation
- ✅ Timeout handling (30 seconds)
- ✅ Error handling and logging

---

## 🚀 Next Steps for CUB Platform

This data collection agent provides the foundation for:

### **1. AI Credit Scoring**
```python
# Use collected transaction data
transaction_data = collected_data['transactions']

# Features to extract:
- Income consistency (regular RECEIVE transactions)
- Spending discipline (balance trends)
- Transaction frequency
- Bill payment history
- Merchant payment patterns
```

### **2. Fraud Detection**
```python
# Analyze for anomalies:
- Unusual transaction volumes
- Irregular spending patterns
- Geographic inconsistencies
- Velocity checks
```

### **3. Behavioral Analysis**
```python
# Time-series analysis:
- Monthly income trends
- Spending categories
- Savings behavior
- Financial stability indicators
```

### **4. Financial Identity Score**
```python
# Calculate composite score from:
- Account age: transaction_data['account_created']
- Transaction volume: summary['total_transactions']
- Financial activity: summary['total_received'] + summary['total_sent']
- Balance stability: variance in balance_after values
```

---

## 📈 Sample Data Statistics

**Per User Dataset:**
- Transactions: 120
- Average Received: 1,500,000 - 2,500,000 XAF
- Average Sent: 1,200,000 - 2,000,000 XAF
- Balance Range: 0 - 100,000 XAF
- Time Period: 12 months
- Account Age: 2-5 years

**Transaction Distribution:**
- RECEIVE: ~25%
- SEND: ~25%
- MERCHANT: ~20%
- AIRTIME: ~10%
- WITHDRAWAL: ~10%
- DEPOSIT: ~5%
- BILL_PAYMENT: ~5%

---

## 🎓 Educational Value

This simulation teaches:
1. **API Integration** - Request/response flows
2. **Webhook Implementation** - Callback patterns
3. **Consent Management** - GDPR-like workflows
4. **Mobile UI Design** - Responsive interfaces
5. **Data Generation** - Realistic mock data
6. **Microservices** - Multi-service architecture

---

## 🏆 Achievement Unlocked

✅ **Data Source Loader Agent - COMPLETE**

You now have a fully functional data collection system that:
- Simulates real mobile money provider APIs
- Handles user consent workflows
- Generates realistic transaction data
- Provides beautiful dashboards
- Works across desktop and mobile
- Is ready for AI integration

**This is production-ready code that can be adapted for real MTN/Orange API integration.**

---

## 📞 Support

**Created by:**  
- NERYNN ANAELLE ILYANA KWANE DINA  
- NGONGUE MODI ALLAN DUVAL

**Institution:** Institut Universitaire de la Côte  
**Project:** Cameroon Union Bank (CUB) - AI Financial Identity & P2P Lending Platform  
**Date:** April 7, 2026

---

## 🎉 Congratulations!

Your CUB Data Collection Agent is **100% operational** and ready to power the financial inclusion revolution in Cameroon! 🇨🇲

**Next agent to build**: Credit Scoring AI or Fraud Detection System?
