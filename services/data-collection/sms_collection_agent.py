#!/usr/bin/env python3
"""
SMS-Based Data Collection Agent for CUB Platform
Fallback mechanism when direct API access to MTN/Orange is unavailable
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from datetime import datetime
import uuid
import json
import os

# Import our SMS parser
from sms_parser import SMSParser

# Import redirect handler
from sms_redirect_handler import create_redirect_html

# Import ntfy notifier
try:
    from sms_ntfy_notifier import SMSNtfyNotifier
    ntfy_enabled = True
except ImportError:
    print("Warning: SMS Ntfy notifier not available")
    ntfy_enabled = False

app = FastAPI(title="CUB SMS Data Collection Agent", version="2.0")

# Initialize SMS parser
sms_parser = SMSParser()

# Initialize ntfy notifier if available
ntfy_notifier = None
if ntfy_enabled and os.path.exists("sms_ntfy_config.json"):
    try:
        ntfy_notifier = SMSNtfyNotifier()
        print(f"✅ Ntfy notifications enabled for topic: {ntfy_notifier.topic_name}")
    except Exception as e:
        print(f"Warning: Could not initialize ntfy notifier: {e}")

# Storage
pending_sms_requests = {}  # Consent requests waiting for approval
collected_sms_data = {}     # Successfully collected SMS data


class SMSDataRequest(BaseModel):
    """Request to collect SMS-based transaction data"""
    user_phone: str
    request_id: Optional[str] = None


class SMSMessage(BaseModel):
    """Individual SMS message"""
    sender: str
    message: str
    timestamp: str  # ISO format


class SMSDataSubmission(BaseModel):
    """Batch of SMS messages submitted from mobile app"""
    request_id: str
    user_phone: str
    messages: List[SMSMessage]
    device_info: Optional[Dict] = None


@app.get("/", response_class=HTMLResponse)
async def sms_dashboard():
    """Dashboard for SMS-based data collection"""
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CUB SMS Data Collection</title>
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
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #2d3748;
                font-size: 28px;
                margin-bottom: 10px;
            }
            
            .badge {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .badge.mechanism-2 {
                background: #f59e0b;
            }
            
            .info-box {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            
            .info-box h3 {
                color: #1e40af;
                margin-bottom: 8px;
                font-size: 16px;
            }
            
            .info-box p {
                color: #1e3a8a;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .request-form {
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                color: #374151;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
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
            
            .data-section {
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            
            .data-section h2 {
                color: #2d3748;
                margin-bottom: 20px;
                font-size: 22px;
            }
            
            .request-card {
                background: #f9fafb;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
            }
            
            .request-card h3 {
                color: #1f2937;
                margin-bottom: 10px;
                font-size: 18px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-pending {
                background: #fef3c7;
                color: #92400e;
            }
            
            .status-completed {
                background: #d1fae5;
                color: #065f46;
            }
            
            .transaction-list {
                margin-top: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .transaction-item {
                background: white;
                border-left: 4px solid #3b82f6;
                padding: 10px;
                margin-bottom: 8px;
                border-radius: 5px;
                font-size: 14px;
            }
            
            .transaction-item.received {
                border-left-color: #10b981;
            }
            
            .transaction-item.sent {
                border-left-color: #ef4444;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .summary-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .summary-card h4 {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 8px;
            }
            
            .summary-card .value {
                font-size: 24px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📱 CUB SMS Data Collection Agent</h1>
                <span class="badge mechanism-2">Mechanism 2: SMS-Based</span>
                
                <div class="info-box">
                    <h3>🔄 How This Works</h3>
                    <p>
                        <strong>Fallback mechanism</strong> when direct API access to MTN/Orange is unavailable. 
                        The mobile app reads SMS transaction notifications from the user's phone and sends 
                        the parsed data to CUB platform.
                    </p>
                </div>
            </div>
            
            <div class="request-form">
                <h2 style="color: #2d3748; margin-bottom: 20px;">📤 Request SMS Data Collection</h2>
                
                <form id="requestForm">
                    <div class="form-group">
                        <label for="phone">User Phone Number</label>
                        <input type="tel" id="phone" placeholder="+237670123456" required>
                    </div>
                    
                    <button type="submit" class="btn">
                        📱 Send SMS Collection Request
                    </button>
                </form>
                
                <div id="result" style="margin-top: 20px;"></div>
            </div>
            
            <div class="data-section">
                <h2>📊 Collected SMS Data</h2>
                <div id="collected-data">
                    <p style="color: #6b7280;">No data collected yet. Send a request to get started.</p>
                </div>
            </div>
            
            <div class="data-section" style="margin-top: 30px;">
                <h2>⏳ Pending Requests</h2>
                <div id="pending-requests">
                    <p style="color: #6b7280;">No pending requests.</p>
                </div>
            </div>
        </div>
        
        <script>
            // Handle form submission
            document.getElementById('requestForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const phone = document.getElementById('phone').value;
                const resultDiv = document.getElementById('result');
                
                resultDiv.innerHTML = '<p style="color: #667eea;">⏳ Sending request...</p>';
                
                try {
                    const response = await fetch('/api/sms/request-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ user_phone: phone })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = `
                            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px;">
                                <strong style="color: #065f46;">✅ Request Created!</strong><br>
                                <span style="color: #047857; font-size: 14px;">
                                    Request ID: ${data.request_id}<br>
                                    The user will receive a notification on their mobile app.
                                </span>
                            </div>
                        `;
                        
                        // Refresh data
                        setTimeout(() => {
                            loadPendingRequests();
                            loadCollectedData();
                        }, 500);
                    } else {
                        resultDiv.innerHTML = `
                            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 5px;">
                                <strong style="color: #991b1b;">❌ Error</strong><br>
                                <span style="color: #b91c1c; font-size: 14px;">${data.message}</span>
                            </div>
                        `;
                    }
                } catch (error) {
                    resultDiv.innerHTML = `
                        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 5px;">
                            <strong style="color: #991b1b;">❌ Error</strong><br>
                            <span style="color: #b91c1c; font-size: 14px;">${error.message}</span>
                        </div>
                    `;
                }
            });
            
            // Load pending requests
            async function loadPendingRequests() {
                try {
                    const response = await fetch('/api/sms/pending-requests');
                    const data = await response.json();
                    
                    const container = document.getElementById('pending-requests');
                    
                    if (data.requests && data.requests.length > 0) {
                        container.innerHTML = data.requests.map(req => `
                            <div class="request-card">
                                <h3>📱 ${req.user_phone}</h3>
                                <span class="status-badge status-${req.status}">${req.status}</span>
                                <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">
                                    Request ID: ${req.request_id}<br>
                                    Created: ${new Date(req.created_at).toLocaleString()}
                                </p>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = '<p style="color: #6b7280;">No pending requests.</p>';
                    }
                } catch (error) {
                    console.error('Error loading pending requests:', error);
                }
            }
            
            // Load collected data
            async function loadCollectedData() {
                try {
                    const response = await fetch('/api/sms/collected-data');
                    const data = await response.json();
                    
                    const container = document.getElementById('collected-data');
                    
                    if (data.collected && data.collected.length > 0) {
                        container.innerHTML = data.collected.map(item => {
                            const summary = item.summary || {};
                            const transactions = item.transactions || [];
                            
                            return `
                                <div class="request-card">
                                    <h3>📱 ${item.user_phone}</h3>
                                    <span class="status-badge status-completed">Completed</span>
                                    
                                    <div class="summary-grid">
                                        <div class="summary-card">
                                            <h4>Total Transactions</h4>
                                            <div class="value">${summary.total_transactions || 0}</div>
                                        </div>
                                        <div class="summary-card">
                                            <h4>Total Received</h4>
                                            <div class="value">${(summary.total_received || 0).toLocaleString()} FCFA</div>
                                        </div>
                                        <div class="summary-card">
                                            <h4>Total Sent</h4>
                                            <div class="value">${(summary.total_sent || 0).toLocaleString()} FCFA</div>
                                        </div>
                                        <div class="summary-card">
                                            <h4>Current Balance</h4>
                                            <div class="value">${(summary.current_balance || 0).toLocaleString()} FCFA</div>
                                        </div>
                                    </div>
                                    
                                    <h4 style="margin-top: 20px; color: #374151;">Recent Transactions:</h4>
                                    <div class="transaction-list">
                                        ${transactions.slice(0, 10).map(t => `
                                            <div class="transaction-item ${t.type.toLowerCase()}">
                                                <strong>${t.type}</strong> - ${t.amount.toLocaleString()} FCFA<br>
                                                <span style="font-size: 12px; color: #6b7280;">
                                                    Balance: ${t.balance_after.toLocaleString()} FCFA | ${t.provider}
                                                </span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else {
                        container.innerHTML = '<p style="color: #6b7280;">No data collected yet.</p>';
                    }
                } catch (error) {
                    console.error('Error loading collected data:', error);
                }
            }
            
            // Load data on page load
            loadPendingRequests();
            loadCollectedData();
            
            // Auto-refresh every 5 seconds
            setInterval(() => {
                loadPendingRequests();
                loadCollectedData();
            }, 5000);
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@app.post("/api/sms/request-data")
async def request_sms_data(request: SMSDataRequest):
    """
    Create a request for SMS-based data collection
    This sends a notification to the mobile app via ntfy
    """
    request_id = request.request_id or str(uuid.uuid4())
    
    pending_sms_requests[request_id] = {
        "request_id": request_id,
        "user_phone": request.user_phone,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "messages_count": 0
    }
    
    # Send push notification via ntfy
    notification_sent = False
    if ntfy_notifier:
        try:
            notification_sent = ntfy_notifier.send_sms_collection_request(
                request_id=request_id,
                user_phone=request.user_phone,
                computer_ip="192.168.192.1"  # Your IP - could be dynamic
            )
        except Exception as e:
            print(f"Error sending ntfy notification: {e}")
    
    return {
        "success": True,
        "request_id": request_id,
        "message": "SMS data collection request created." + 
                   (" Push notification sent to your phone!" if notification_sent else " Check your ntfy app!"),
        "status": "pending",
        "notification_sent": notification_sent,
        "ntfy_topic": ntfy_notifier.topic_name if ntfy_notifier else None
    }


@app.post("/api/sms/submit-data")
async def submit_sms_data(submission: SMSDataSubmission):
    """
    Mobile app submits collected SMS messages
    This endpoint receives the raw SMS data and parses it
    """
    request_id = submission.request_id
    
    # Verify request exists
    if request_id not in pending_sms_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Convert Pydantic models to dicts for parsing
    messages = [
        {
            'sender': msg.sender,
            'message': msg.message,
            'timestamp': datetime.fromisoformat(msg.timestamp)
        }
        for msg in submission.messages
    ]
    
    # Parse SMS messages
    parsed_transactions, failed = sms_parser.parse_sms_batch(messages)
    
    # Generate summary
    summary = sms_parser.generate_transaction_summary(parsed_transactions)
    
    # Store collected data
    collected_sms_data[request_id] = {
        "request_id": request_id,
        "user_phone": submission.user_phone,
        "transactions": parsed_transactions,
        "summary": summary,
        "raw_messages_count": len(messages),
        "parsed_count": len(parsed_transactions),
        "failed_count": len(failed),
        "device_info": submission.device_info,
        "collected_at": datetime.now().isoformat(),
        "status": "completed"
    }
    
    # Update pending request
    pending_sms_requests[request_id]["status"] = "completed"
    pending_sms_requests[request_id]["messages_count"] = len(parsed_transactions)
    pending_sms_requests[request_id]["completed_at"] = datetime.now().isoformat()
    
    # Send completion notification via ntfy
    if ntfy_notifier:
        try:
            ntfy_notifier.send_collection_complete(
                request_id=request_id,
                user_phone=submission.user_phone,
                transactions_count=len(parsed_transactions),
                total_received=summary.get("total_received", 0),
                total_sent=summary.get("total_sent", 0)
            )
        except Exception as e:
            print(f"Error sending completion notification: {e}")
    
    return {
        "success": True,
        "request_id": request_id,
        "parsed_transactions": len(parsed_transactions),
        "failed_to_parse": len(failed),
        "summary": summary,
        "message": f"Successfully parsed {len(parsed_transactions)} transactions from {len(messages)} SMS messages"
    }


@app.get("/api/sms/pending-requests")
async def get_pending_sms_requests():
    """Get all pending SMS data collection requests"""
    return {
        "requests": list(pending_sms_requests.values())
    }


@app.get("/api/sms/collected-data")
async def get_collected_sms_data():
    """Get all collected SMS data"""
    return {
        "collected": list(collected_sms_data.values())
    }


@app.get("/api/sms/request/{request_id}")
async def get_sms_request_status(request_id: str):
    """Get status of specific SMS collection request"""
    if request_id in collected_sms_data:
        return collected_sms_data[request_id]
    elif request_id in pending_sms_requests:
        return pending_sms_requests[request_id]
    else:
        raise HTTPException(status_code=404, detail="Request not found")


@app.get("/redirect/{request_id}", response_class=HTMLResponse)
async def redirect_to_app(request_id: str):
    """
    Redirect page that opens the mobile app
    Works better with Expo Go than direct deep links
    """
    # Get request details
    if request_id in pending_sms_requests:
        request_data = pending_sms_requests[request_id]
        user_phone = request_data.get("user_phone", "")
    else:
        user_phone = ""
    
    # Return HTML redirect page
    return create_redirect_html(request_id, user_phone)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SMS Data Collection Agent",
        "pending_requests": len(pending_sms_requests),
        "collected_data": len(collected_sms_data)
    }


if __name__ == "__main__":
    print("=" * 60)
    print("🏦 CUB SMS Data Collection Agent")
    print("=" * 60)
    print()
    print("📱 Mechanism 2: SMS-Based Data Collection")
    print("   Fallback when direct API access is unavailable")
    print()
    print("🌐 Dashboard: http://localhost:8004")
    print("🔌 API Docs: http://localhost:8004/docs")
    print()
    print("=" * 60)
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8004)
