# CUB Data Collection Agent - Simulation System

## Overview
This system simulates the MTN/Orange Money data collection flow for the CUB platform.

## Architecture

```
┌─────────────────────────────────┐
│  CUB Data Collection Agent      │
│  (Port 8001)                    │
│  - Initiates data requests      │
│  - Receives collected data      │
│  - Displays transaction data    │
└────────────┬────────────────────┘
             │ HTTP Request
             ↓
┌─────────────────────────────────┐
│  MTN/Orange Server Simulator    │
│  (Port 8000)                    │
│  - Receives data requests       │
│  - Generates consent requests   │
│  - Stores mock transaction data │
│  - Posts data back to CUB       │
└────────────┬────────────────────┘
             │ Consent Request
             ↓
┌─────────────────────────────────┐
│  Mobile Consent Interface       │
│  (Responsive Web - Your Phone)  │
│  - Shows consent request        │
│  - User approves/denies         │
└─────────────────────────────────┘
```

## Components

### 1. MTN/Orange Server Simulator (`mtn_orange_server.py`)
- Simulates MTN Mobile Money and Orange Money APIs
- Generates realistic transaction data
- Handles consent workflow
- Posts approved data to CUB agent

### 2. CUB Data Collection Agent (`cub_data_agent.py`)
- Initiates data collection requests
- Receives transaction data from providers
- Displays collected data
- Stores data for future AI processing

### 3. Mobile Consent Interface (`mobile_consent_ui.html`)
- Mobile-responsive interface
- Shows data request details
- Approve/Deny buttons
- Accessible from your phone

## Quick Start

### Terminal 1: Start MTN/Orange Server
```bash
cd data_collection_agent
python3 mtn_orange_server.py
```
Server runs on: http://localhost:8000

### Terminal 2: Start CUB Data Collection Agent
```bash
cd data_collection_agent
python3 cub_data_agent.py
```
Agent runs on: http://localhost:8001

### On Your Phone:
1. Connect to same WiFi network as your computer
2. Find your computer's IP address (run `hostname -I` or `ipconfig`)
3. Open browser on phone: `http://YOUR_COMPUTER_IP:8000/consent/pending`
4. You'll see consent requests appear here

## Usage Flow

1. **Request Data**: Visit `http://localhost:8001` and click "Request Data Collection"
2. **Consent Appears**: On your phone, visit the consent URL
3. **Approve**: Click "Approve" on your phone
4. **Data Sent**: MTN/Orange server posts data to CUB agent
5. **View Data**: CUB agent displays the collected transaction data

## API Endpoints

### MTN/Orange Server (Port 8000)
- `POST /api/v1/data-request` - Initiate data collection request
- `GET /consent/pending` - View pending consent requests (mobile interface)
- `POST /consent/{request_id}/approve` - Approve data sharing
- `POST /consent/{request_id}/deny` - Deny data sharing
- `GET /health` - Health check

### CUB Data Agent (Port 8001)
- `GET /` - Dashboard showing all collected data
- `POST /request-data` - Request data from MTN/Orange
- `POST /webhook/data-received` - Receive data from MTN/Orange
- `GET /collected-data` - View all collected data (JSON)

## Data Format

Transaction data follows this structure:
```json
{
  "user_phone": "+237670123456",
  "provider": "MTN",
  "data_period": "2025-04-07 to 2026-04-07",
  "transactions": [
    {
      "transaction_id": "MTN-20260407-001",
      "date": "2026-04-07",
      "type": "RECEIVE",
      "amount": 15000,
      "balance_after": 45000,
      "counterparty": "+237699887766",
      "description": "Transfer from Jean"
    }
  ],
  "summary": {
    "total_transactions": 120,
    "total_received": 500000,
    "total_sent": 350000,
    "average_balance": 42000
  }
}
```
