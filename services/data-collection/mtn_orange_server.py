#!/usr/bin/env python3
"""
MTN/Orange Money Server Simulator
Simulates the mobile money provider's data sharing API
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import httpx
from datetime import datetime, timedelta
import random
import uuid
import json
import os
import asyncio

# Import notification systems
telegram_config = {}
telegram_enabled = False
ntfy_config = {}
ntfy_enabled = False

# Load Telegram config
try:
    config_path = os.path.join(os.path.dirname(__file__), 'telegram_config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            telegram_config = json.load(f)
            telegram_enabled = telegram_config.get('enabled', False)
            if telegram_enabled:
                print("✅ Telegram notifications ENABLED")
except Exception as e:
    pass

# Load Ntfy config
try:
    config_path = os.path.join(os.path.dirname(__file__), 'ntfy_config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            ntfy_config = json.load(f)
            ntfy_enabled = ntfy_config.get('enabled', False)
            if ntfy_enabled:
                print(f"✅ Ntfy.sh notifications ENABLED (topic: {ntfy_config.get('topic_name')})")
except Exception as e:
    pass

if not telegram_enabled and not ntfy_enabled:
    print("ℹ️  Push notifications disabled (configure ntfy_config.json or telegram_config.json)")

app = FastAPI(title="MTN/Orange Money Simulator", version="1.0")

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for pending consent requests
pending_requests = {}
approved_data = {}


class DataRequest(BaseModel):
    user_phone: str
    provider: str  # "MTN" or "ORANGE"
    callback_url: str
    request_id: Optional[str] = None


class ConsentResponse(BaseModel):
    approved: bool
    request_id: str


def generate_mock_transactions(phone: str, provider: str, num_transactions: int = 120):
    """Generate realistic mobile money transaction data"""
    transactions = []
    current_date = datetime.now()
    balance = random.randint(10000, 50000)
    
    transaction_types = [
        ("RECEIVE", "Transfer from"),
        ("SEND", "Transfer to"),
        ("AIRTIME", "Airtime purchase"),
        ("BILL_PAYMENT", "Bill payment"),
        ("MERCHANT", "Payment to"),
        ("WITHDRAWAL", "Cash withdrawal"),
        ("DEPOSIT", "Cash deposit"),
    ]
    
    names = ["Jean", "Marie", "Paul", "Grace", "David", "Emma", "Samuel", "Rita"]
    merchants = ["Jumia", "Supermarket", "Pharmacy", "Restaurant", "Gas Station"]
    
    for i in range(num_transactions):
        days_ago = random.randint(0, 365)
        trans_date = current_date - timedelta(days=days_ago)
        
        trans_type, desc_prefix = random.choice(transaction_types)
        
        if trans_type == "RECEIVE":
            amount = random.randint(5000, 100000)
            balance += amount
            counterparty = f"+237{random.randint(650000000, 699999999)}"
            description = f"{desc_prefix} {random.choice(names)}"
        elif trans_type == "SEND":
            amount = random.randint(1000, 50000)
            balance -= amount
            counterparty = f"+237{random.randint(650000000, 699999999)}"
            description = f"{desc_prefix} {random.choice(names)}"
        elif trans_type == "AIRTIME":
            amount = random.randint(500, 5000)
            balance -= amount
            counterparty = provider
            description = "Airtime purchase"
        elif trans_type == "MERCHANT":
            amount = random.randint(2000, 30000)
            balance -= amount
            counterparty = f"MERCHANT_{random.randint(1000, 9999)}"
            description = f"{desc_prefix} {random.choice(merchants)}"
        elif trans_type == "WITHDRAWAL":
            amount = random.randint(5000, 50000)
            balance -= amount
            counterparty = f"AGENT_{random.randint(100, 999)}"
            description = "Cash withdrawal"
        elif trans_type == "DEPOSIT":
            amount = random.randint(10000, 100000)
            balance += amount
            counterparty = f"AGENT_{random.randint(100, 999)}"
            description = "Cash deposit"
        else:
            amount = random.randint(5000, 50000)
            balance -= amount
            counterparty = random.choice(merchants)
            description = f"Bill payment - {random.choice(['Electricity', 'Water', 'Internet'])}"
        
        transactions.append({
            "transaction_id": f"{provider}-{trans_date.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}",
            "date": trans_date.strftime("%Y-%m-%d %H:%M:%S"),
            "type": trans_type,
            "amount": amount,
            "balance_after": max(balance, 0),
            "counterparty": counterparty,
            "description": description
        })
    
    # Sort by date (most recent first)
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    # Calculate summary statistics
    total_received = sum(t["amount"] for t in transactions if t["type"] in ["RECEIVE", "DEPOSIT"])
    total_sent = sum(t["amount"] for t in transactions if t["type"] in ["SEND", "WITHDRAWAL", "AIRTIME", "MERCHANT", "BILL_PAYMENT"])
    avg_balance = sum(t["balance_after"] for t in transactions) // len(transactions)
    
    return {
        "user_phone": phone,
        "provider": provider,
        "data_period": f"{(current_date - timedelta(days=365)).strftime('%Y-%m-%d')} to {current_date.strftime('%Y-%m-%d')}",
        "account_created": (current_date - timedelta(days=random.randint(730, 1825))).strftime("%Y-%m-%d"),
        "transactions": transactions,
        "summary": {
            "total_transactions": len(transactions),
            "total_received": total_received,
            "total_sent": total_sent,
            "net_balance": total_received - total_sent,
            "average_balance": avg_balance,
            "current_balance": transactions[0]["balance_after"] if transactions else 0
        }
    }


@app.get("/")
async def root():
    return {
        "service": "MTN/Orange Money Simulator",
        "status": "running",
        "endpoints": {
            "data_request": "POST /api/v1/data-request",
            "consent_ui": "GET /consent/pending",
            "approve": "POST /consent/{request_id}/approve",
            "deny": "POST /consent/{request_id}/deny"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/v1/data-request")
async def create_data_request(request: DataRequest):
    """
    Endpoint called by CUB agent to request user's transaction data
    Creates a consent request that user must approve on their phone
    NOW WITH TELEGRAM PUSH NOTIFICATIONS!
    """
    request_id = request.request_id or str(uuid.uuid4())
    
    pending_requests[request_id] = {
        "request_id": request_id,
        "user_phone": request.user_phone,
        "provider": request.provider,
        "callback_url": request.callback_url,
        "created_at": datetime.now().isoformat(),
        "status": "pending"
    }
    
    # Send push notifications
    notification_sent = False
    notification_method = None
    
    # Try Ntfy first (simpler and faster)
    if ntfy_enabled and ntfy_config.get('topic_name'):
        try:
            from ntfy_notifier import NtfyNotifier
            
            notifier = NtfyNotifier(ntfy_config['topic_name'])
            notification_sent = await notifier.send_consent_request(
                request_id=request_id,
                user_phone=request.user_phone,
                provider=request.provider,
                callback_base_url=ntfy_config.get("callback_base_url", "http://127.0.0.1:8000")
            )
            
            if notification_sent:
                notification_method = "ntfy"
                print(f"✅ Ntfy notification sent for request {request_id[:8]}...")
        except Exception as e:
            print(f"⚠️  Could not send Ntfy notification: {e}")
    
    # Fallback to Telegram if Ntfy failed or not configured
    if not notification_sent and telegram_enabled and telegram_config.get('bot_token') and telegram_config.get('chat_id'):
        try:
            from telegram_notifier import send_notification
            
            notification_sent = await send_notification(
                bot_token=telegram_config['bot_token'],
                chat_id=telegram_config['chat_id'],
                request_id=request_id,
                user_phone=request.user_phone,
                provider=request.provider
            )
            
            if notification_sent:
                notification_method = "telegram"
                print(f"✅ Telegram notification sent for request {request_id[:8]}...")
        except Exception as e:
            print(f"⚠️  Could not send Telegram notification: {e}")
    
    response_message = "Data request created."
    if notification_sent:
        response_message += f" 📱 Push notification sent to your phone via {notification_method}!"
    else:
        response_message += " User must approve at /consent/pending"
    
    return {
        "success": True,
        "request_id": request_id,
        "message": response_message,
        "consent_url": f"/consent/pending",
        "notification_sent": notification_sent,
        "notification_method": notification_method,
        "status": "pending"
    }


@app.get("/consent/pending", response_class=HTMLResponse)
async def get_pending_consents():
    """Mobile-friendly interface showing pending consent requests"""
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Consent Request</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                color: white;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .request-card {
                background: white;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .provider-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 16px;
            }
            
            .provider-mtn {
                background: #FFCC00;
                color: #000;
            }
            
            .provider-orange {
                background: #FF6600;
                color: white;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .info-row:last-of-type {
                border-bottom: none;
            }
            
            .info-label {
                color: #666;
                font-size: 14px;
            }
            
            .info-value {
                color: #000;
                font-weight: 600;
                font-size: 14px;
            }
            
            .buttons {
                display: flex;
                gap: 12px;
                margin-top: 20px;
            }
            
            .btn {
                flex: 1;
                padding: 16px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-approve {
                background: #10b981;
                color: white;
            }
            
            .btn-approve:active {
                background: #059669;
                transform: scale(0.98);
            }
            
            .btn-deny {
                background: #ef4444;
                color: white;
            }
            
            .btn-deny:active {
                background: #dc2626;
                transform: scale(0.98);
            }
            
            .no-requests {
                text-align: center;
                color: white;
                padding: 40px;
            }
            
            .no-requests h2 {
                font-size: 20px;
                margin-bottom: 10px;
            }
            
            .success-message {
                background: #10b981;
                color: white;
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 16px;
                text-align: center;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 Data Consent Requests</h1>
                <p>CUB Platform is requesting access to your transaction data</p>
            </div>
            
            <div id="messages"></div>
            <div id="requests"></div>
        </div>
        
        <script>
            async function loadRequests() {
                const response = await fetch('/api/v1/consent/list');
                const data = await response.json();
                const container = document.getElementById('requests');
                
                if (data.pending_requests.length === 0) {
                    container.innerHTML = `
                        <div class="no-requests">
                            <h2>No Pending Requests</h2>
                            <p>All caught up! 🎉</p>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = data.pending_requests.map(req => `
                    <div class="request-card" id="card-${req.request_id}">
                        <span class="provider-badge provider-${req.provider.toLowerCase()}">${req.provider} Mobile Money</span>
                        
                        <div class="info-row">
                            <span class="info-label">Phone Number</span>
                            <span class="info-value">${req.user_phone}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Requested</span>
                            <span class="info-value">${new Date(req.created_at).toLocaleString()}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Data Period</span>
                            <span class="info-value">Last 12 months</span>
                        </div>
                        
                        <div class="buttons">
                            <button class="btn btn-approve" onclick="handleConsent('${req.request_id}', true)">
                                ✓ Approve
                            </button>
                            <button class="btn btn-deny" onclick="handleConsent('${req.request_id}', false)">
                                ✗ Deny
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            
            async function handleConsent(requestId, approved) {
                const action = approved ? 'approve' : 'deny';
                const card = document.getElementById(`card-${requestId}`);
                
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                
                try {
                    const response = await fetch(`/consent/${requestId}/${action}`, {
                        method: 'POST'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage(approved ? 'Data approved and sent!' : 'Request denied', approved);
                        setTimeout(() => {
                            card.remove();
                            loadRequests();
                        }, 1500);
                    } else {
                        alert('Error: ' + result.message);
                        card.style.opacity = '1';
                        card.style.pointerEvents = 'auto';
                    }
                } catch (error) {
                    alert('Network error');
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
            }
            
            function showMessage(text, isSuccess) {
                const messages = document.getElementById('messages');
                const msg = document.createElement('div');
                msg.className = 'success-message';
                msg.textContent = text;
                msg.style.background = isSuccess ? '#10b981' : '#ef4444';
                messages.appendChild(msg);
                
                setTimeout(() => msg.remove(), 3000);
            }
            
            // Load requests on page load
            loadRequests();
            
            // Reload every 5 seconds to check for new requests
            setInterval(loadRequests, 5000);
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@app.get("/api/v1/consent/list")
async def list_consent_requests():
    """API endpoint to get pending consent requests (used by mobile UI)"""
    pending = [req for req in pending_requests.values() if req["status"] == "pending"]
    return {"pending_requests": pending}


@app.post("/consent/{request_id}/approve")
@app.get("/consent/{request_id}/approve")
async def approve_consent(request_id: str):
    """User approves data sharing from their phone"""
    if request_id not in pending_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req = pending_requests[request_id]
    
    if req["status"] != "pending":
        # Already processed - show beautiful "Process Completed" page
        from fastapi.responses import HTMLResponse
        status_emoji = "✅" if req["status"] == "approved" else "🚫"
        status_color = "#10b981" if req["status"] == "approved" else "#64748b"
        status_bg = "linear-gradient(135deg, #10b981 0%, #059669 100%)" if req["status"] == "approved" else "linear-gradient(135deg, #64748b 0%, #475569 100%)"
        
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="UTF-8">
            <title>Process Completed</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: {status_bg};
                    padding: 20px;
                }}
                .card {{
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: slideUp 0.5s ease-out;
                }}
                @keyframes slideUp {{
                    from {{ opacity: 0; transform: translateY(30px); }}
                    to {{ opacity: 1; transform: translateY(0); }}
                }}
                .emoji {{ font-size: 80px; margin-bottom: 20px; }}
                h1 {{
                    color: {status_color};
                    font-size: 32px;
                    margin-bottom: 15px;
                    font-weight: 700;
                }}
                p {{
                    color: #6b7280;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }}
                .info-box {{
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    margin: 25px 0;
                    border-left: 4px solid {status_color};
                }}
                .close-btn {{
                    background: {status_color};
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="emoji">{status_emoji}</div>
                <h1>Process Completed</h1>
                <p>
                    This consent request has already been <strong>{req["status"]}</strong>.
                    No further action is needed.
                </p>
                
                <div class="info-box">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        ⏰ Processed: {req.get("approved_at", req.get("denied_at", "N/A"))[:19].replace("T", " ")}
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #9ca3af;">
                    This notification is no longer active. Please close this window.
                </p>
                
                <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
        </body>
        </html>
        """)
    
    # Generate mock transaction data
    transaction_data = generate_mock_transactions(
        req["user_phone"],
        req["provider"]
    )
    
    # Mark as approved
    req["status"] = "approved"
    req["approved_at"] = datetime.now().isoformat()
    
    # Send data to CUB agent via callback
    success = False
    callback_status = 0
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                req["callback_url"],
                json={
                    "request_id": request_id,
                    "status": "approved",
                    "data": transaction_data,
                    "timestamp": datetime.now().isoformat()
                }
            )
            success = response.status_code == 200
            callback_status = response.status_code
    except Exception as e:
        print(f"Error sending data: {e}")
    
    # Return beautiful HTML response
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <title>{'✅ Approved!' if success else '⚠️ Error'}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: {'linear-gradient(135deg, #10b981 0%, #059669 100%)' if success else 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
                padding: 20px;
            }}
            .card {{
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 450px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.5s ease-out;
            }}
            @keyframes slideUp {{
                from {{
                    opacity: 0;
                    transform: translateY(30px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            .emoji {{
                font-size: 80px;
                margin-bottom: 20px;
                animation: bounce 1s ease infinite;
            }}
            @keyframes bounce {{
                0%, 100% {{ transform: translateY(0); }}
                50% {{ transform: translateY(-10px); }}
            }}
            h1 {{
                color: {'#059669' if success else '#dc2626'};
                font-size: 32px;
                margin-bottom: 15px;
                font-weight: 700;
            }}
            p {{
                color: #6b7280;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 25px;
            }}
            .info-box {{
                background: {'#f0fdf4' if success else '#fef2f2'};
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border-left: 4px solid {'#10b981' if success else '#ef4444'};
            }}
            .info-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid {'#d1fae5' if success else '#fee2e2'};
            }}
            .info-row:last-child {{
                border-bottom: none;
            }}
            .label {{
                color: #9ca3af;
                font-size: 14px;
                font-weight: 500;
            }}
            .value {{
                color: #1f2937;
                font-weight: 600;
                font-size: 14px;
                text-align: right;
            }}
            .close-btn {{
                background: {'#059669' if success else '#dc2626'};
                color: white;
                border: none;
                padding: 14px 32px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
                width: 100%;
            }}
            .close-btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }}
            .close-btn:active {{
                transform: translateY(0);
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="emoji">{'✅' if success else '⚠️'}</div>
            <h1>{'Data Approved!' if success else 'Approval Error'}</h1>
            <p>
                {'Your transaction data has been successfully collected and sent to CUB Platform.' if success else 'There was an error sending your data. Please try again or contact support.'}
            </p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="label">Provider</span>
                    <span class="value">{req["provider"]} Mobile Money</span>
                </div>
                <div class="info-row">
                    <span class="label">Phone Number</span>
                    <span class="value">{req["user_phone"]}</span>
                </div>
                <div class="info-row">
                    <span class="label">Transactions</span>
                    <span class="value">120 collected</span>
                </div>
                <div class="info-row">
                    <span class="label">Status</span>
                    <span class="value">{'✓ Approved' if success else '✗ Failed'}</span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #9ca3af;">
                {'You can now view your financial profile on the CUB dashboard.' if success else f'Error details: Status {callback_status}'}
            </p>
            
            <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
    </body>
    </html>
    """)


@app.post("/consent/{request_id}/deny")
@app.get("/consent/{request_id}/deny")
async def deny_consent(request_id: str):
    """User denies data sharing"""
    if request_id not in pending_requests:
        # Return HTML for not found
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="UTF-8">
            <title>Request Not Found</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                    padding: 20px;
                }
                .card {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 450px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .emoji { font-size: 80px; margin-bottom: 20px; }
                h1 { color: #6b7280; font-size: 28px; margin-bottom: 15px; }
                p { color: #9ca3af; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="emoji">❓</div>
                <h1>Request Not Found</h1>
                <p>This consent request has expired or doesn't exist.</p>
            </div>
        </body>
        </html>
        """, status_code=404)
    
    req = pending_requests[request_id]
    
    if req["status"] != "pending":
        # Already processed - show same "Process Completed" page for consistency
        from fastapi.responses import HTMLResponse
        status_emoji = "✅" if req["status"] == "approved" else "🚫"
        status_color = "#10b981" if req["status"] == "approved" else "#64748b"
        status_bg = "linear-gradient(135deg, #10b981 0%, #059669 100%)" if req["status"] == "approved" else "linear-gradient(135deg, #64748b 0%, #475569 100%)"
        
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="UTF-8">
            <title>Process Completed</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: {status_bg};
                    padding: 20px;
                }}
                .card {{
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: slideUp 0.5s ease-out;
                }}
                @keyframes slideUp {{
                    from {{ opacity: 0; transform: translateY(30px); }}
                    to {{ opacity: 1; transform: translateY(0); }}
                }}
                .emoji {{ font-size: 80px; margin-bottom: 20px; }}
                h1 {{
                    color: {status_color};
                    font-size: 32px;
                    margin-bottom: 15px;
                    font-weight: 700;
                }}
                p {{
                    color: #6b7280;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }}
                .info-box {{
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    margin: 25px 0;
                    border-left: 4px solid {status_color};
                }}
                .close-btn {{
                    background: {status_color};
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="emoji">{status_emoji}</div>
                <h1>Process Completed</h1>
                <p>
                    This consent request has already been <strong>{req["status"]}</strong>.
                    No further action is needed.
                </p>
                
                <div class="info-box">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        ⏰ Processed: {req.get("approved_at", req.get("denied_at", "N/A"))[:19].replace("T", " ")}
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #9ca3af;">
                    This notification is no longer active. Please close this window.
                </p>
                
                <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
        </body>
        </html>
        """)
    
    # Mark as denied
    req["status"] = "denied"
    req["denied_at"] = datetime.now().isoformat()
    
    # Notify CUB agent
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(
                req["callback_url"],
                json={
                    "request_id": request_id,
                    "status": "denied",
                    "message": "User denied data sharing consent",
                    "timestamp": datetime.now().isoformat()
                }
            )
    except:
        pass
    
    # Return beautiful HTML response for decline
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <title>Request Declined</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                padding: 20px;
            }}
            .card {{
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 450px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.5s ease-out;
            }}
            @keyframes slideUp {{
                from {{
                    opacity: 0;
                    transform: translateY(30px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            .emoji {{
                font-size: 80px;
                margin-bottom: 20px;
            }}
            h1 {{
                color: #475569;
                font-size: 32px;
                margin-bottom: 15px;
                font-weight: 700;
            }}
            p {{
                color: #6b7280;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 25px;
            }}
            .info-box {{
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border-left: 4px solid #64748b;
            }}
            .info-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }}
            .info-row:last-child {{
                border-bottom: none;
            }}
            .label {{
                color: #9ca3af;
                font-size: 14px;
                font-weight: 500;
            }}
            .value {{
                color: #1f2937;
                font-weight: 600;
                font-size: 14px;
                text-align: right;
            }}
            .close-btn {{
                background: #64748b;
                color: white;
                border: none;
                padding: 14px 32px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
                width: 100%;
            }}
            .close-btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="emoji">🚫</div>
            <h1>Request Declined</h1>
            <p>
                You have declined to share your transaction data with CUB Platform.
                Your privacy is important to us.
            </p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="label">Provider</span>
                    <span class="value">{req["provider"]} Mobile Money</span>
                </div>
                <div class="info-row">
                    <span class="label">Phone Number</span>
                    <span class="value">{req["user_phone"]}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status</span>
                    <span class="value">✗ Declined</span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #9ca3af;">
                No data has been collected or shared. You can request data sharing again later if needed.
            </p>
            
            <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
    </body>
    </html>
    """)


if __name__ == "__main__":
    print("🚀 Starting MTN/Orange Money Server Simulator...")
    print("📱 Mobile Consent UI: http://localhost:8000/consent/pending")
    print("🔌 API Endpoint: http://localhost:8000/api/v1/data-request")
    uvicorn.run(app, host="0.0.0.0", port=8000)
