#!/usr/bin/env python3
"""
HTTP Redirect Handler for SMS Collection
Creates a redirect page that works with Expo Go
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse

def create_redirect_html(request_id: str, user_phone: str) -> str:
    """
    Create HTML page that redirects to Expo deep link
    This works better with Expo Go than direct deep links
    """
    
    # Expo deep link format
    expo_link = f"exp://192.168.192.1:8081/--/sms-collect?requestId={request_id}&phone={user_phone}"
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opening CUB App...</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        
        .container {{
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }}
        
        .icon {{
            font-size: 60px;
            margin-bottom: 20px;
        }}
        
        h1 {{
            color: #2d3748;
            font-size: 24px;
            margin-bottom: 10px;
        }}
        
        p {{
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
        }}
        
        .loader {{
            width: 50px;
            height: 50px;
            border: 5px solid #e5e7eb;
            border-top: 5px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }}
        
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.2s;
        }}
        
        .button:hover {{
            transform: translateY(-2px);
        }}
        
        .button-secondary {{
            background: #e5e7eb;
            color: #2d3748;
        }}
        
        .info {{
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: left;
        }}
        
        .info-title {{
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
        }}
        
        .info-text {{
            font-size: 14px;
            color: #1e3a8a;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>Opening CUB App...</h1>
        <p>Please wait while we redirect you to the CUB mobile app to collect your SMS data.</p>
        
        <div class="loader"></div>
        
        <div class="info">
            <div class="info-title">What's Next:</div>
            <div class="info-text">
                1. CUB app will open automatically<br>
                2. Grant SMS permission when asked<br>
                3. Your data will be collected<br>
                4. You'll see the results!
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <a href="{expo_link}" class="button" id="openApp">Open CUB App</a>
            <a href="http://192.168.192.1:8004" class="button button-secondary">View Dashboard</a>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            Request ID: {request_id[:8]}...
        </p>
    </div>
    
    <script>
        // Auto-redirect after 2 seconds
        setTimeout(function() {{
            window.location.href = "{expo_link}";
        }}, 2000);
        
        // Fallback: manual button
        document.getElementById('openApp').addEventListener('click', function(e) {{
            e.preventDefault();
            window.location.href = "{expo_link}";
        }});
    </script>
</body>
</html>
    """
    
    return html
