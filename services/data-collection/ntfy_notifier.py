#!/usr/bin/env python3
"""
Ntfy.sh Notifier for CUB Data Collection Agent
Sends push notifications directly to your phone - NO ACCOUNT NEEDED!
"""

import httpx
import json
from datetime import datetime

class NtfyNotifier:
    def __init__(self, topic_name):
        """
        Initialize ntfy notifier
        
        Args:
            topic_name: Your private topic name (e.g., "cub-consent-allan")
        """
        self.topic_name = topic_name
        self.base_url = "https://ntfy.sh"
        
    async def send_consent_request(self, request_id, user_phone, provider, callback_base_url="http://192.168.137.1:8000"):
        """
        Send consent request notification with approve/decline buttons
        
        Args:
            request_id: Unique request identifier
            user_phone: User's phone number
            provider: MTN or ORANGE
            callback_base_url: Base URL for approve/decline callbacks
        """
        
        # Provider emoji (use simple text to avoid encoding issues)
        provider_icon = "[MTN]" if provider == "MTN" else "[ORANGE]"
        
        # Create notification message
        title = f"{provider_icon} CUB Data Consent Request"
        message = (
            f"Provider: {provider} Mobile Money\n"
            f"Phone: {user_phone}\n"
            f"Time: {datetime.now().strftime('%H:%M:%S')}\n\n"
            f"CUB Platform wants to collect your transaction data "
            f"for the last 12 months to create your financial identity.\n\n"
            f"Tap a button below to respond:"
        )
        
        # Create approve and decline action URLs
        # Use HTTP action - now that network is fixed, direct approval works!
        approve_url = f"{callback_base_url}/consent/{request_id}/approve"
        decline_url = f"{callback_base_url}/consent/{request_id}/deny"
        
        # Prepare notification payload with action buttons
        # Use 'view' action to open in browser (more reliable with port forwarding)
        headers = {
            "Title": title,
            "Priority": "high",
            "Tags": "white_check_mark,money_with_wings",
            "Actions": json.dumps([
                {
                    "action": "view",
                    "label": "✅ Approve",
                    "url": approve_url,
                    "clear": True
                },
                {
                    "action": "view",
                    "label": "❌ Decline", 
                    "url": decline_url,
                    "clear": True
                }
            ])
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/{self.topic_name}",
                    headers=headers,
                    content=message
                )
                
                if response.status_code == 200:
                    print(f"✅ Ntfy notification sent for request {request_id[:8]}...")
                    return True
                else:
                    print(f"❌ Ntfy notification failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error sending ntfy notification: {e}")
            return False
    
    async def send_test_notification(self):
        """Send a test notification to verify setup"""
        
        headers = {
            "Title": "🏦 CUB Data Collection Agent",
            "Priority": "default",
            "Tags": "white_check_mark"
        }
        
        message = (
            "✅ Ntfy notifications are working!\n\n"
            "You will receive consent requests here.\n"
            "Test completed successfully."
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/{self.topic_name}",
                    headers=headers,
                    content=message
                )
                
                return response.status_code == 200
        except Exception as e:
            print(f"❌ Error sending test notification: {e}")
            return False


# For standalone testing
if __name__ == "__main__":
    import asyncio
    
    print("🔔 Ntfy.sh Notification Test")
    print()
    print("Enter your ntfy topic name (e.g., cub-consent-allan):")
    topic = input("Topic: ").strip()
    
    if not topic:
        print("❌ No topic provided")
        exit(1)
    
    async def test():
        notifier = NtfyNotifier(topic)
        print(f"\n📤 Sending test notification to: {topic}")
        print("Check your phone...")
        
        success = await notifier.send_test_notification()
        
        if success:
            print("\n✅ Test notification sent!")
            print("If you didn't receive it, make sure:")
            print("  1. Ntfy app is installed on your phone")
            print(f"  2. You're subscribed to topic: {topic}")
            print("  3. Phone has internet connection")
        else:
            print("\n❌ Failed to send test notification")
    
    asyncio.run(test())
