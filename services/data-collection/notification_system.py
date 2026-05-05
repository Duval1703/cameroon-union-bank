#!/usr/bin/env python3
"""
Notification System for Mobile Consent Requests
Provides multiple ways to notify users on their phone
"""

import qrcode
from io import BytesIO
import base64

def generate_qr_code(url):
    """Generate QR code for the consent URL"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for embedding in HTML
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def generate_notification_html(consent_url, request_id, user_phone, provider):
    """Generate HTML notification with QR code"""
    qr_code = generate_qr_code(consent_url)
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Consent Request</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: #f5f5f5;
            }}
            .notification-card {{
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
            }}
            .qr-code {{
                margin: 20px auto;
                padding: 20px;
                background: white;
                border: 3px solid #667eea;
                border-radius: 12px;
                display: inline-block;
            }}
            .qr-code img {{
                display: block;
                max-width: 300px;
                height: auto;
            }}
            .instructions {{
                background: #e8f4f8;
                border-left: 4px solid #0066cc;
                padding: 15px;
                margin: 20px 0;
                text-align: left;
            }}
            .url-box {{
                background: #f0f0f0;
                padding: 10px;
                border-radius: 6px;
                font-family: monospace;
                word-break: break-all;
                margin: 10px 0;
                font-size: 12px;
            }}
            h2 {{
                color: #667eea;
                margin-top: 0;
            }}
            .provider-badge {{
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                margin: 10px 0;
            }}
            .mtn {{
                background: #FFCC00;
                color: #000;
            }}
            .orange {{
                background: #FF6600;
                color: white;
            }}
        </style>
    </head>
    <body>
        <div class="notification-card">
            <h2>📱 New Consent Request</h2>
            
            <span class="provider-badge {provider.lower()}">{provider} Mobile Money</span>
            
            <p><strong>Phone:</strong> {user_phone}</p>
            <p><strong>Request ID:</strong> {request_id[:20]}...</p>
            
            <div class="instructions">
                <h3>🎯 How to Approve on Your Phone:</h3>
                <ol>
                    <li><strong>Open your phone camera</strong></li>
                    <li><strong>Point it at the QR code below</strong></li>
                    <li><strong>Tap the notification that appears</strong></li>
                    <li><strong>Click "Approve" on the page that opens</strong></li>
                </ol>
            </div>
            
            <div class="qr-code">
                <img src="{qr_code}" alt="QR Code">
            </div>
            
            <p><strong>OR manually type this URL in your phone browser:</strong></p>
            <div class="url-box">{consent_url}</div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                ⏰ This request will remain active until you approve or deny it.
            </p>
        </div>
    </body>
    </html>
    """
    
    return html


def send_telegram_notification(bot_token, chat_id, message, consent_url):
    """Send notification via Telegram (if configured)"""
    try:
        import requests
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": f"{message}\n\n{consent_url}",
            "parse_mode": "HTML"
        }
        
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def send_email_notification(to_email, subject, consent_url, user_phone, provider):
    """Send email notification with consent link"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['To'] = to_email
        
        text = f"""
CUB Platform - Data Consent Request

Provider: {provider}
Phone: {user_phone}

Please approve the consent request by clicking:
{consent_url}
        """
        
        html = f"""
        <html>
        <body>
            <h2>CUB Platform - Data Consent Request</h2>
            <p><strong>Provider:</strong> {provider}</p>
            <p><strong>Phone:</strong> {user_phone}</p>
            <p>
                <a href="{consent_url}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Approve Request
                </a>
            </p>
        </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Note: Configure SMTP settings
        # smtp = smtplib.SMTP('smtp.gmail.com', 587)
        # smtp.starttls()
        # smtp.login(sender_email, password)
        # smtp.send_message(msg)
        # smtp.quit()
        
        return {"status": "Email notification ready (configure SMTP)"}
    except Exception as e:
        return {"error": str(e)}
