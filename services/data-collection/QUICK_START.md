# 🚀 Quick Start Guide - CUB Data Collection Agent

## ✅ System Successfully Built and Tested!

The complete data collection simulation is working perfectly. Here's how to use it:

---

## 📋 What You Have

1. **MTN/Orange Money Server Simulator** - Runs on port 8000
2. **CUB Data Collection Agent** - Runs on port 8001
3. **Mobile Consent Interface** - Accessible from your phone
4. **Automatic Data Generation** - Creates realistic transaction data

---

## 🎯 How It Works

```
┌──────────────────┐
│   CUB Agent      │  1. Request data for user
│   (localhost:    │────────────────────┐
│    8001)         │                    │
└──────────────────┘                    ▼
                              ┌──────────────────┐
                              │  MTN/Orange      │  2. Create consent request
                              │  Server          │
                              │  (localhost:     │
                              │   8000)          │
                              └──────────────────┘
                                        │
                              3. User approves    │
                                 on phone         │
                                        │         │
                              ┌──────────────────┐│
                              │  Mobile Browser  ││
                              │  (Your Phone)    ││
                              └──────────────────┘│
                                        │         │
                              4. Send data back   │
                                        ▼         ▼
                              ┌──────────────────┐
                              │  CUB Agent       │  5. Display data
                              │  Dashboard       │
                              └──────────────────┘
```

---

## 🏃‍♂️ Step-by-Step Instructions

### **Step 1: Start the Servers**

**On Linux/Mac:**
```bash
cd data_collection_agent
./start_servers.sh
```

**On Windows:**
```cmd
cd data_collection_agent
start_servers.bat
```

**Or manually:**
```bash
# Terminal 1: Start MTN/Orange Server
cd data_collection_agent
python3 mtn_orange_server.py

# Terminal 2: Start CUB Agent
cd data_collection_agent
python3 cub_data_agent.py
```

---

### **Step 2: Open the CUB Dashboard**

Open your browser and go to:
```
http://localhost:8001
```

You'll see the CUB Data Collection Agent dashboard.

---

### **Step 3: Request Data**

1. Fill in the form:
   - **Phone Number**: `+237670123456` (or any number)
   - **Provider**: Select `MTN` or `ORANGE`

2. Click **"Request Data Collection"**

3. You'll see a success message with a consent URL

---

### **Step 4: Approve on Your Phone**

#### **Option A: On the Same Computer (Testing)**
Open in another browser tab:
```
http://localhost:8000/consent/pending
```

#### **Option B: On Your Phone (Real Scenario)**

1. **Find your computer's IP address:**
   - **Linux/Mac**: Run `hostname -I` or `ifconfig`
   - **Windows**: Run `ipconfig` and find IPv4 Address

2. **Connect your phone to the SAME WiFi network** as your computer

3. **Open phone browser** and go to:
   ```
   http://YOUR_COMPUTER_IP:8000/consent/pending
   ```
   Example: `http://192.168.1.100:8000/consent/pending`

4. **You'll see the consent request** - Click **"✓ Approve"**

---

### **Step 5: View the Collected Data**

Go back to the CUB dashboard (`http://localhost:8001`)

You'll see:
- ✅ Transaction summary (total received, sent, balance)
- 📊 120 realistic mobile money transactions
- 💰 Financial statistics
- 📄 Full JSON data

---

## 🎉 Example Output

After approval, you'll see data like this:

```
MTN - +237670123456

Summary:
✓ Total Transactions: 120
✓ Total Received: 2,180,300 XAF
✓ Total Sent: 1,581,744 XAF
✓ Current Balance: 421,302 XAF

Recent Transactions:
- MERCHANT: Payment to Pharmacy (-8,095 XAF)
- RECEIVE: Transfer from Jean (+15,000 XAF)
- SEND: Transfer to Marie (-20,000 XAF)
- AIRTIME: Airtime purchase (-2,000 XAF)
...
```

---

## 🔧 Testing the System Programmatically

Run the automated test:

```bash
cd data_collection_agent
python3 << 'EOF'
import httpx
import time

# Request data
response = httpx.post(
    "http://localhost:8001/request-data",
    json={"user_phone": "+237670123456", "provider": "MTN"}
)
request_id = response.json()['request_id']
print(f"Request ID: {request_id}")

# Approve (simulating user)
httpx.post(f"http://localhost:8000/consent/{request_id}/approve")

# Check collected data
time.sleep(2)
response = httpx.get("http://localhost:8001/collected-data")
data = response.json()
print(f"Collected {data['total_count']} datasets!")
EOF
```

---

## 📱 Mobile Access URLs

| Service | Desktop URL | Mobile URL |
|---------|-------------|------------|
| CUB Agent Dashboard | http://localhost:8001 | http://YOUR_IP:8001 |
| Consent Interface | http://localhost:8000/consent/pending | http://YOUR_IP:8000/consent/pending |
| MTN/Orange API | http://localhost:8000 | http://YOUR_IP:8000 |

---

## 🛑 Stopping the Servers

**Press `Ctrl+C` in the terminal** where servers are running

Or kill the processes:
```bash
# Linux/Mac
pkill -f "python.*mtn_orange_server"
pkill -f "python.*cub_data_agent"

# Windows
taskkill /F /IM python.exe
```

---

## 📊 Generated Data Structure

Each transaction includes:
- **Transaction ID**: Unique identifier
- **Date**: Timestamp of transaction
- **Type**: RECEIVE, SEND, AIRTIME, MERCHANT, etc.
- **Amount**: Transaction amount in XAF
- **Balance**: Account balance after transaction
- **Counterparty**: Who sent/received the money
- **Description**: Human-readable description

---

## 🔍 API Endpoints

### **CUB Agent (Port 8001)**
- `GET /` - Main dashboard
- `POST /request-data` - Request data from provider
- `POST /webhook/data-received` - Receive data from provider
- `GET /collected-data` - View all collected data
- `GET /pending-requests` - View pending requests

### **MTN/Orange Server (Port 8000)**
- `GET /` - API info
- `POST /api/v1/data-request` - Create data request
- `GET /consent/pending` - Mobile consent UI
- `POST /consent/{id}/approve` - Approve consent
- `POST /consent/{id}/deny` - Deny consent
- `GET /api/v1/consent/list` - List pending consents

---

## ✅ Success Indicators

You know it's working when:
1. ✓ Both servers start without errors
2. ✓ Dashboard loads at http://localhost:8001
3. ✓ Consent UI loads at http://localhost:8000/consent/pending
4. ✓ After clicking "Request Data", you see a pending request
5. ✓ After approval, transaction data appears in the dashboard
6. ✓ You can see 120 transactions with realistic data

---

## 🎯 Next Steps for CUB Platform

This data collection agent provides the foundation for:

1. **Credit Scoring AI** - Use transaction history to calculate credit scores
2. **Fraud Detection** - Analyze patterns for suspicious activity
3. **Behavioral Analysis** - Understand spending habits
4. **Financial Identity** - Build user profiles from transaction data
5. **Loan Eligibility** - Determine borrowing limits

The collected data is in the perfect format to feed into your AI models!

---

## 🐛 Troubleshooting

**Problem**: Can't access from phone
- **Solution**: Make sure phone is on same WiFi network
- Check computer firewall isn't blocking ports 8000/8001

**Problem**: Servers won't start
- **Solution**: Check if ports are already in use
- Run: `lsof -i :8000` and `lsof -i :8001` (Linux/Mac)

**Problem**: Data not appearing after approval
- **Solution**: Check console logs for errors
- Refresh the CUB dashboard page

---

## 📞 Support

Created by: NERYNN ANAELLE & NGONGUE MODI ALLAN
For: Cameroon Union Bank (CUB) Platform
Date: April 7, 2026

---

**🎉 Congratulations! Your Data Collection Agent is ready for production!**
