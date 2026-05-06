#!/usr/bin/env python3
"""
Telegram Bot Notifier for CUB Data Collection Agent
Sends push notifications directly to your phone!
"""

import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import httpx
from datetime import datetime
import os

PUBLIC_PROVIDER_URL = os.getenv(
    "PUBLIC_PROVIDER_URL",
    "https://mboatrust-provider-simulator.onrender.com"
).rstrip("/")

class TelegramNotifier:
    def __init__(self, bot_token, chat_id):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.app = None
        self.pending_requests = {}
        
    async def initialize(self):
        """Initialize the Telegram bot"""
        self.app = Application.builder().token(self.bot_token).build()
        
        # Add handlers
        self.app.add_handler(CommandHandler("start", self.start_command))
        self.app.add_handler(CallbackQueryHandler(self.button_callback))
        
        # Start the bot
        await self.app.initialize()
        await self.app.start()
        await self.app.updater.start_polling()
        
        print("✅ Telegram bot initialized and listening...")
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        chat_id = update.effective_chat.id
        await update.message.reply_text(
            f"🏦 CUB Data Collection Bot\n\n"
            f"✅ Bot is active!\n"
            f"Your Chat ID: `{chat_id}`\n\n"
            f"You'll receive notifications here when data consent is requested.",
            parse_mode='Markdown'
        )
        
    async def send_consent_request(self, request_id, user_phone, provider):
        """Send consent request notification to phone"""
        
        # Store request details
        self.pending_requests[request_id] = {
            "user_phone": user_phone,
            "provider": provider,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create approve/decline buttons
        keyboard = [
            [
                InlineKeyboardButton("✅ Approve", callback_data=f"approve_{request_id}"),
                InlineKeyboardButton("❌ Decline", callback_data=f"decline_{request_id}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Provider emoji
        emoji = "🟡" if provider == "MTN" else "🟠"
        
        # Send notification
        message = (
            f"{emoji} *Data Consent Request*\n\n"
            f"*Provider:* {provider} Mobile Money\n"
            f"*Phone:* {user_phone}\n"
            f"*Request ID:* `{request_id[:20]}...`\n"
            f"*Time:* {datetime.now().strftime('%H:%M:%S')}\n\n"
            f"📊 *CUB Platform* wants to collect your transaction data "
            f"for the last 12 months to create your financial identity.\n\n"
            f"👇 *Choose your action:*"
        )
        
        try:
            await self.app.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
            return True
        except Exception as e:
            print(f"❌ Error sending Telegram notification: {e}")
            return False
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button clicks (Approve/Decline)"""
        query = update.callback_query
        await query.answer()
        
        # Parse callback data
        action, request_id = query.data.split('_', 1)
        
        if request_id not in self.pending_requests:
            await query.edit_message_text(
                "❌ This request has expired or was already processed."
            )
            return
        
        request_info = self.pending_requests[request_id]
        
        if action == "approve":
            # User approved - send to MTN/Orange server
            await query.edit_message_text(
                f"✅ *Approved!*\n\n"
                f"Processing your approval...",
                parse_mode='Markdown'
            )
            
            # Call MTN/Orange server to approve
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{PUBLIC_PROVIDER_URL}/consent/{request_id}/approve"
                    )
                    result = response.json()
                    
                    if result.get("success"):
                        await query.edit_message_text(
                            f"✅ *Data Approved & Sent!*\n\n"
                            f"Provider: {request_info['provider']}\n"
                            f"Phone: {request_info['user_phone']}\n\n"
                            f"Your transaction data has been collected and sent to CUB Platform.\n"
                            f"Check the dashboard to see your financial profile!",
                            parse_mode='Markdown'
                        )
                    else:
                        await query.edit_message_text(
                            f"❌ Error processing approval: {result.get('message')}"
                        )
            except Exception as e:
                await query.edit_message_text(
                    f"❌ Error connecting to server: {str(e)}"
                )
            
            # Remove from pending
            del self.pending_requests[request_id]
            
        elif action == "decline":
            # User declined
            await query.edit_message_text(
                f"❌ *Declined*\n\n"
                f"Processing your decline...",
                parse_mode='Markdown'
            )
            
            # Call MTN/Orange server to deny
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{PUBLIC_PROVIDER_URL}/consent/{request_id}/deny"
                    )
                    
                    await query.edit_message_text(
                        f"❌ *Data Request Declined*\n\n"
                        f"Provider: {request_info['provider']}\n"
                        f"Phone: {request_info['user_phone']}\n\n"
                        f"You have declined to share your transaction data.",
                        parse_mode='Markdown'
                    )
            except Exception as e:
                await query.edit_message_text(
                    f"❌ Error: {str(e)}"
                )
            
            # Remove from pending
            del self.pending_requests[request_id]
    
    async def stop(self):
        """Stop the bot"""
        if self.app:
            await self.app.updater.stop()
            await self.app.stop()
            await self.app.shutdown()


# Singleton instance
_notifier_instance = None

async def get_notifier(bot_token, chat_id):
    """Get or create the notifier instance"""
    global _notifier_instance
    
    if _notifier_instance is None:
        _notifier_instance = TelegramNotifier(bot_token, chat_id)
        await _notifier_instance.initialize()
    
    return _notifier_instance


async def send_notification(bot_token, chat_id, request_id, user_phone, provider):
    """Send a consent request notification"""
    notifier = await get_notifier(bot_token, chat_id)
    return await notifier.send_consent_request(request_id, user_phone, provider)


# For testing
if __name__ == "__main__":
    print("🤖 Telegram Bot Notifier")
    print("\nThis module provides push notifications to your phone via Telegram.")
    print("\nTo use:")
    print("1. Create a bot with @BotFather on Telegram")
    print("2. Get your bot token and chat ID")
    print("3. Configure in telegram_config.json")
    print("4. The bot will send notifications when data requests are made")
