#!/usr/bin/env python3
"""
Ntfy Push Notification Integration for SMS Data Collection (Mechanism 2)
Sends push notifications to user's phone via ntfy.sh
"""

import requests
import json
import os
from typing import Optional


class SMSNtfyNotifier:
    """Send push notifications for SMS collection requests via ntfy.sh"""
    
    def __init__(self, config_file: str = "sms_ntfy_config.json"):
        """Initialize ntfy notifier with configuration"""
        self.config = self.load_config(config_file)
        self.ntfy_server = self.config.get("ntfy_server", "https://ntfy.sh")
        self.topic_name = self.config.get("topic_name", "cub_consent")
        self.enabled = self.config.get("enabled", True)
        
    def load_config(self, config_file: str) -> dict:
        """Load ntfy configuration from JSON file"""
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load {config_file}: {e}")
        
        # Default configuration
        return {
            "topic_name": "cub_consent",
            "ntfy_server": "https://ntfy.sh",
            "enabled": True
        }
    
    def send_sms_collection_request(
        self, 
        request_id: str, 
        user_phone: str,
        computer_ip: str = "192.168.192.1"
    ) -> bool:
        """
        Send push notification for SMS data collection request
        
        Args:
            request_id: Unique request ID
            user_phone: User's phone number
            computer_ip: IP address of computer running backend
        
        Returns:
            True if notification sent successfully, False otherwise
        """
        if not self.enabled:
            print("Ntfy notifications disabled in config")
            return False
        
        try:
            # Use HTTP redirect page instead of direct deep link (works better with Expo Go)
            redirect_url = f"http://{computer_ip}:8004/redirect/{request_id}"
            dashboard_url = f"http://{computer_ip}:8004"
            
            # Create notification message
            title = "CUB SMS Data Collection Request"
            message = (
                f"CUB wants to collect your MTN/Orange Money transaction SMS messages "
                f"to build your financial identity.\n\n"
                f"Phone: {user_phone}\n"
                f"Request ID: {request_id[:8]}...\n\n"
                f"Tap 'Approve' to automatically collect and send your data."
            )
            
            # Create action buttons
            actions = [
                {
                    "action": "view",
                    "label": "Approve",
                    "url": redirect_url,  # Opens redirect page that launches app
                    "clear": True
                },
                {
                    "action": "view",
                    "label": "View Dashboard",
                    "url": dashboard_url,
                    "clear": False
                }
            ]
            
            # Prepare headers (no emoji tags - causes encoding issues)
            headers = {
                "Title": title,
                "Priority": "high",
                "Tags": "cub,sms,consent",
                "Click": redirect_url,  # Click notification to open redirect
                "Actions": json.dumps(actions)
            }
            
            # Send notification
            url = f"{self.ntfy_server}/{self.topic_name}"
            
            response = requests.post(
                url,
                data=message.encode('utf-8'),
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Ntfy notification sent successfully to topic: {self.topic_name}")
                print(f"   Request ID: {request_id}")
                print(f"   Phone: {user_phone}")
                print(f"   Topic: {self.topic_name}")
                return True
            else:
                print(f"❌ Failed to send ntfy notification: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending ntfy notification: {e}")
            return False
    
    def send_collection_complete(
        self,
        request_id: str,
        user_phone: str,
        transactions_count: int,
        total_received: float,
        total_sent: float
    ) -> bool:
        """
        Send notification when SMS collection is complete
        
        Args:
            request_id: Request ID
            user_phone: User's phone number
            transactions_count: Number of transactions parsed
            total_received: Total amount received
            total_sent: Total amount sent
        
        Returns:
            True if sent successfully
        """
        if not self.enabled:
            return False
        
        try:
            title = "SMS Collection Complete!"
            message = (
                f"Successfully collected and parsed your transaction data.\n\n"
                f"Phone: {user_phone}\n"
                f"Transactions: {transactions_count}\n"
                f"Total Received: {total_received:,.0f} FCFA\n"
                f"Total Sent: {total_sent:,.0f} FCFA\n\n"
                f"Your financial identity is ready for credit scoring!"
            )
            
            headers = {
                "Title": title,
                "Priority": "default",
                "Tags": "cub,complete,success"
            }
            
            url = f"{self.ntfy_server}/{self.topic_name}"
            
            response = requests.post(
                url,
                data=message.encode('utf-8'),
                headers=headers
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error sending completion notification: {e}")
            return False
    
    def test_notification(self) -> bool:
        """Send a test notification to verify setup"""
        try:
            title = "CUB SMS Collection - Test"
            message = (
                f"This is a test notification for SMS data collection.\n\n"
                f"Topic: {self.topic_name}\n"
                f"Server: {self.ntfy_server}\n\n"
                f"If you see this, your notifications are working!"
            )
            
            headers = {
                "Title": title,
                "Priority": "default",
                "Tags": "test,cub"
            }
            
            url = f"{self.ntfy_server}/{self.topic_name}"
            
            response = requests.post(
                url,
                data=message.encode('utf-8'),
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Test notification sent successfully!")
                print(f"   Check your ntfy app for topic: {self.topic_name}")
                return True
            else:
                print(f"❌ Failed to send test notification: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending test notification: {e}")
            return False


# Standalone testing
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Testing SMS Ntfy Notifier")
    print("=" * 60)
    print()
    
    notifier = SMSNtfyNotifier()
    
    print(f"Configuration:")
    print(f"  Topic: {notifier.topic_name}")
    print(f"  Server: {notifier.ntfy_server}")
    print(f"  Enabled: {notifier.enabled}")
    print()
    
    # Send test notification
    print("Sending test notification...")
    print()
    
    success = notifier.test_notification()
    
    if success:
        print()
        print("=" * 60)
        print("✅ Test notification sent!")
        print(f"📱 Check your ntfy app for topic: {notifier.topic_name}")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("❌ Test failed - check configuration")
        print("=" * 60)
