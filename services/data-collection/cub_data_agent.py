#!/usr/bin/env python3
"""
CUB Data Collection Agent
Requests and receives transaction data from MTN/Orange Money providers
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
import httpx
from datetime import datetime
import json
import uuid
import webbrowser
import os
import tempfile

# Import notification system
try:
    from notification_system import generate_qr_code, generate_notification_html
except ImportError:
    generate_qr_code = None
    generate_notification_html = None

app = FastAPI(title="CUB Data Collection Agent", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for collected data
collected_data = {}
pending_requests = {}


class DataCollectionRequest(BaseModel):
    user_phone: str
    provider: str  # "MTN" or "ORANGE"
    user_id: Optional[str] = None


# Configuration for MTN/Orange server and public webhook URL.
# In local development these default to localhost. In deployment, Render provides
# public HTTPS URLs through environment variables.
MTN_ORANGE_SERVER = os.getenv("MTN_ORANGE_SERVER_URL", "http://localhost:8000").rstrip("/")
PUBLIC_DATA_AGENT_URL = os.getenv("PUBLIC_DATA_AGENT_URL", "http://localhost:8001").rstrip("/")


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Main dashboard showing data collection interface and collected data"""
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CUB Data Collection Agent</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f7fa;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 14px;
            }
            
            .card {
                background: white;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .card h2 {
                font-size: 20px;
                margin-bottom: 20px;
                color: #1a202c;
            }
            
            .form-group {
                margin-bottom: 16px;
            }
            
            label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #4a5568;
                font-size: 14px;
            }
            
            input, select {
                width: 100%;
                padding: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            
            input:focus, select:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .btn:active {
                transform: translateY(0);
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 10px;
            }
            
            .status-pending {
                background: #fef3c7;
                color: #92400e;
            }
            
            .status-approved {
                background: #d1fae5;
                color: #065f46;
            }
            
            .status-denied {
                background: #fee2e2;
                color: #991b1b;
            }
            
            .data-preview {
                background: #f7fafc;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .data-preview pre {
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            
            .transaction-item {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .transaction-item .left {
                flex: 1;
            }
            
            .transaction-item .right {
                text-align: right;
            }
            
            .transaction-type {
                font-size: 12px;
                color: #718096;
                margin-bottom: 4px;
            }
            
            .transaction-desc {
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 4px;
            }
            
            .transaction-date {
                font-size: 11px;
                color: #a0aec0;
            }
            
            .amount-positive {
                color: #059669;
                font-weight: 700;
                font-size: 16px;
            }
            
            .amount-negative {
                color: #dc2626;
                font-weight: 700;
                font-size: 16px;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-top: 16px;
            }
            
            .summary-item {
                background: #f7fafc;
                padding: 16px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .summary-label {
                font-size: 12px;
                color: #718096;
                margin-bottom: 8px;
            }
            
            .summary-value {
                font-size: 24px;
                font-weight: 700;
                color: #1a202c;
            }
            
            .alert {
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .alert-info {
                background: #dbeafe;
                color: #1e40af;
                border-left: 4px solid #3b82f6;
            }
            
            .alert-success {
                background: #d1fae5;
                color: #065f46;
                border-left: 4px solid #10b981;
            }
            
            .no-data {
                text-align: center;
                padding: 40px;
                color: #a0aec0;
            }
            
            .refresh-btn {
                background: #e2e8f0;
                color: #4a5568;
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                margin-left: 10px;
            }
            
            .refresh-btn:hover {
                background: #cbd5e0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 CUB Data Collection Agent</h1>
                <p>AI Financial Identity & P2P Lending Platform - Data Source Loader</p>
            </div>
            
            <div id="alerts"></div>
            
            <div class="card">
                <h2>📲 Request Transaction Data</h2>
                <form id="requestForm">
                    <div class="form-group">
                        <label for="user_phone">User Phone Number</label>
                        <input type="tel" id="user_phone" name="user_phone" 
                               placeholder="+237670123456" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="provider">Mobile Money Provider</label>
                        <select id="provider" name="provider" required>
                            <option value="">Select Provider</option>
                            <option value="MTN">MTN Mobile Money</option>
                            <option value="ORANGE">Orange Money</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn" id="submitBtn">
                        Request Data Collection
                    </button>
                </form>
            </div>
            
            <div class="card">
                <h2>
                    📊 Collected Transaction Data
                    <button class="refresh-btn" onclick="loadCollectedData()">🔄 Refresh</button>
                </h2>
                <div id="collectedDataContainer"></div>
            </div>
            
            <div class="card">
                <h2>⏳ Pending Requests</h2>
                <div id="pendingRequestsContainer"></div>
            </div>
        </div>
        
        <script>
            // Handle form submission
            document.getElementById('requestForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Requesting...';
                
                const formData = {
                    user_phone: document.getElementById('user_phone').value,
                    provider: document.getElementById('provider').value
                };
                
                try {
                    const response = await fetch('/request-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showAlert('success', 
                            `✓ Data request sent! Request ID: ${result.request_id}<br>` +
                            `Open the consent URL on your phone to approve: <br>` +
                            `<a href="${result.consent_url}" target="_blank" style="color: #059669; text-decoration: underline;">${result.consent_url}</a>`
                        );
                        loadPendingRequests();
                        document.getElementById('requestForm').reset();
                    } else {
                        showAlert('error', '✗ Error: ' + result.message);
                    }
                } catch (error) {
                    showAlert('error', '✗ Network error: ' + error.message);
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = 'Request Data Collection';
            });
            
            function showAlert(type, message) {
                const alerts = document.getElementById('alerts');
                const alert = document.createElement('div');
                alert.className = type === 'success' ? 'alert alert-success' : 'alert alert-info';
                alert.innerHTML = message;
                alerts.appendChild(alert);
                
                setTimeout(() => alert.remove(), 10000);
            }
            
            async function loadCollectedData() {
                const container = document.getElementById('collectedDataContainer');
                
                try {
                    const response = await fetch('/collected-data');
                    const data = await response.json();
                    
                    if (data.collected_data.length === 0) {
                        container.innerHTML = '<div class="no-data">No data collected yet. Submit a request above.</div>';
                        return;
                    }
                    
                    container.innerHTML = data.collected_data.map(item => {
                        const transData = item.data;
                        return `
                            <div style="margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                                <h3 style="color: #1a202c; margin-bottom: 10px;">
                                    ${transData.provider} - ${transData.user_phone}
                                    <span class="status-badge status-approved">✓ Collected</span>
                                </h3>
                                <p style="color: #718096; font-size: 13px; margin-bottom: 16px;">
                                    Period: ${transData.data_period} | Collected: ${new Date(item.timestamp).toLocaleString()}
                                </p>
                                
                                <div class="summary-grid">
                                    <div class="summary-item">
                                        <div class="summary-label">Total Transactions</div>
                                        <div class="summary-value">${transData.summary.total_transactions}</div>
                                    </div>
                                    <div class="summary-item">
                                        <div class="summary-label">Total Received</div>
                                        <div class="summary-value" style="color: #059669;">
                                            ${transData.summary.total_received.toLocaleString()} XAF
                                        </div>
                                    </div>
                                    <div class="summary-item">
                                        <div class="summary-label">Total Sent</div>
                                        <div class="summary-value" style="color: #dc2626;">
                                            ${transData.summary.total_sent.toLocaleString()} XAF
                                        </div>
                                    </div>
                                    <div class="summary-item">
                                        <div class="summary-label">Current Balance</div>
                                        <div class="summary-value">
                                            ${transData.summary.current_balance.toLocaleString()} XAF
                                        </div>
                                    </div>
                                </div>
                                
                                <h4 style="margin: 20px 0 12px; color: #4a5568;">Recent Transactions (Last 10)</h4>
                                ${transData.transactions.slice(0, 10).map(trans => `
                                    <div class="transaction-item">
                                        <div class="left">
                                            <div class="transaction-type">${trans.type}</div>
                                            <div class="transaction-desc">${trans.description}</div>
                                            <div class="transaction-date">${trans.date}</div>
                                        </div>
                                        <div class="right">
                                            <div class="${trans.type === 'RECEIVE' || trans.type === 'DEPOSIT' ? 'amount-positive' : 'amount-negative'}">
                                                ${trans.type === 'RECEIVE' || trans.type === 'DEPOSIT' ? '+' : '-'}${trans.amount.toLocaleString()} XAF
                                            </div>
                                            <div class="transaction-date">Balance: ${trans.balance_after.toLocaleString()}</div>
                                        </div>
                                    </div>
                                `).join('')}
                                
                                <details style="margin-top: 16px;">
                                    <summary style="cursor: pointer; color: #667eea; font-weight: 600;">
                                        View Full JSON Data
                                    </summary>
                                    <div class="data-preview">
                                        <pre>${JSON.stringify(transData, null, 2)}</pre>
                                    </div>
                                </details>
                            </div>
                        `;
                    }).join('');
                } catch (error) {
                    container.innerHTML = '<div class="no-data">Error loading data</div>';
                }
            }
            
            async function loadPendingRequests() {
                const container = document.getElementById('pendingRequestsContainer');
                
                try {
                    const response = await fetch('/pending-requests');
                    const data = await response.json();
                    
                    if (data.pending_requests.length === 0) {
                        container.innerHTML = '<div class="no-data">No pending requests</div>';
                        return;
                    }
                    
                    container.innerHTML = data.pending_requests.map(req => `
                        <div class="transaction-item">
                            <div class="left">
                                <div class="transaction-type">Request ID: ${req.request_id}</div>
                                <div class="transaction-desc">${req.provider} - ${req.user_phone}</div>
                                <div class="transaction-date">Requested: ${new Date(req.created_at).toLocaleString()}</div>
                            </div>
                            <div class="right">
                                <span class="status-badge status-pending">⏳ Pending</span>
                            </div>
                        </div>
                    `).join('');
                } catch (error) {
                    container.innerHTML = '<div class="no-data">Error loading pending requests</div>';
                }
            }
            
            // Load data on page load
            loadCollectedData();
            loadPendingRequests();
            
            // Auto-refresh every 5 seconds
            setInterval(() => {
                loadCollectedData();
                loadPendingRequests();
            }, 5000);
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@app.post("/request-data")
async def request_data_collection(request: DataCollectionRequest):
    """
    Initiate a data collection request to MTN/Orange server
    Now with automatic notification popup!
    """
    request_id = str(uuid.uuid4())
    
    # Prepare callback URL for receiving data. This must be public in deployment
    # so the provider simulator can call back into the data agent.
    callback_url = f"{PUBLIC_DATA_AGENT_URL}/webhook/data-received"
    
    # Send request to MTN/Orange server
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{MTN_ORANGE_SERVER}/api/v1/data-request",
                json={
                    "user_phone": request.user_phone,
                    "provider": request.provider,
                    "callback_url": callback_url,
                    "request_id": request_id
                }
            )
            
            result = response.json()
            
            if result.get("success"):
                # Store pending request
                pending_requests[request_id] = {
                    "request_id": request_id,
                    "user_phone": request.user_phone,
                    "provider": request.provider,
                    "status": "pending",
                    "created_at": datetime.now().isoformat()
                }
                
                # Get computer's IP for mobile access
                import socket
                hostname = socket.gethostname()
                local_ip = socket.gethostbyname(hostname)
                
                # Build consent URL
                consent_url = f"{MTN_ORANGE_SERVER}/consent/pending"
                
                notification_opened = False

                # Generate QR code notification and auto-open in browser
                if False and generate_notification_html:
                    try:
                        notification_html = generate_notification_html(
                            consent_url=consent_url,
                            request_id=request_id,
                            user_phone=request.user_phone,
                            provider=request.provider
                        )

                        # Save notification to the OS temp folder and open in browser.
                        notification_path = os.path.join(
                            tempfile.gettempdir(),
                            f"cub_consent_{request_id[:8]}.html"
                        )
                        with open(notification_path, 'w', encoding='utf-8') as f:
                            f.write(notification_html)

                        # Auto-open notification in browser (this pops up automatically!)
                        webbrowser.open(f'file://{notification_path}')
                        notification_opened = True
                    except Exception as notification_error:
                        print(f"Could not open consent notification: {notification_error}")
                
                return {
                    "success": True,
                    "request_id": request_id,
                    "message": "✅ Consent request created! QR code notification opened automatically.",
                    "consent_url": consent_url,
                    "notification_opened": notification_opened,
                    "status": "pending"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send request to provider"
                }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error connecting to MTN/Orange server: {str(e)}"
        }


@app.post("/webhook/data-received")
async def receive_data(request: Request):
    """
    Webhook endpoint that receives data from MTN/Orange server
    after user approves consent
    """
    body = await request.json()
    
    request_id = body.get("request_id")
    status = body.get("status")
    
    if status == "approved":
        # Store the collected data
        collected_data[request_id] = {
            "request_id": request_id,
            "data": body.get("data"),
            "timestamp": body.get("timestamp"),
            "status": "collected"
        }
        
        # Update pending request status
        if request_id in pending_requests:
            pending_requests[request_id]["status"] = "approved"
            pending_requests[request_id]["approved_at"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "message": "Data received and stored successfully",
            "request_id": request_id
        }
    
    elif status == "denied":
        # Update pending request status
        if request_id in pending_requests:
            pending_requests[request_id]["status"] = "denied"
            pending_requests[request_id]["denied_at"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "message": "User denied data sharing consent",
            "request_id": request_id
        }
    
    return {
        "success": False,
        "message": "Unknown status"
    }


@app.get("/collected-data")
async def get_collected_data():
    """Get all collected transaction data"""
    return {
        "collected_data": list(collected_data.values()),
        "total_count": len(collected_data)
    }


@app.get("/pending-requests")
async def get_pending_requests():
    """Get all pending data collection requests"""
    pending = [req for req in pending_requests.values() if req["status"] == "pending"]
    return {
        "pending_requests": pending,
        "total_count": len(pending)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms."""
    return {
        "status": "healthy",
        "service": "data-collection-agent",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("DATA_AGENT_PORT", "8001")))
    print("🚀 Starting CUB Data Collection Agent...")
    print(f"📊 Dashboard: http://localhost:{port}")
    print(f"🔌 Webhook: {PUBLIC_DATA_AGENT_URL}/webhook/data-received")
    uvicorn.run(app, host="0.0.0.0", port=port)
