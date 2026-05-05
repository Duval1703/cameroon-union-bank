#!/usr/bin/env python3
"""
Helper script to get your Telegram Chat ID
"""

import json
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

print("=" * 60)
print("  🤖 Get Your Telegram Chat ID")
print("=" * 60)
print()

# Load config
try:
    with open('telegram_config.json', 'r') as f:
        config = json.load(f)
        bot_token = config.get('bot_token', '')
except:
    bot_token = ''

if not bot_token or bot_token == 'YOUR_BOT_TOKEN_HERE':
    print("⚠️  Bot token not configured yet!")
    print()
    print("Please enter your bot token (from @BotFather):")
    bot_token = input("Bot Token: ").strip()
    
    if not bot_token:
        print("❌ No token provided. Exiting.")
        exit(1)

print()
print("✓ Bot token received")
print()
print("📱 NOW DO THIS ON YOUR PHONE:")
print("   1. Open Telegram")
print("   2. Search for your bot (the name you gave it)")
print("   3. Start a chat with your bot")
print("   4. Send /start to your bot")
print()
print("Waiting for your /start message...")
print("(Press Ctrl+C to cancel)")
print()

chat_id_found = None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    global chat_id_found
    chat_id = update.effective_chat.id
    
    print("=" * 60)
    print("  ✅ CHAT ID FOUND!")
    print("=" * 60)
    print()
    print(f"Your Chat ID: {chat_id}")
    print()
    
    # Update config file
    try:
        with open('telegram_config.json', 'r') as f:
            config = json.load(f)
        
        config['bot_token'] = bot_token
        config['chat_id'] = str(chat_id)
        config['enabled'] = True
        
        with open('telegram_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print("✅ Configuration saved to telegram_config.json")
        print()
        print("You can now:")
        print("  1. Restart the MTN/Orange server")
        print("  2. Test notifications!")
        print()
        
    except Exception as e:
        print(f"⚠️  Could not save config: {e}")
        print()
        print("Please manually update telegram_config.json with:")
        print(f'  "bot_token": "{bot_token}",')
        print(f'  "chat_id": "{chat_id}",')
        print(f'  "enabled": true')
        print()
    
    await update.message.reply_text(
        "✅ Perfect! Your Chat ID has been configured.\n\n"
        "🔔 You will now receive push notifications here when "
        "data consent is requested!\n\n"
        "Test it by requesting data from the CUB dashboard."
    )
    
    chat_id_found = chat_id

async def main():
    """Main function"""
    app = Application.builder().token(bot_token).build()
    app.add_handler(CommandHandler("start", start))
    
    # Start the bot
    await app.initialize()
    await app.start()
    await app.updater.start_polling()
    
    # Wait for /start command
    try:
        while chat_id_found is None:
            await asyncio.sleep(1)
        
        # Give time to send reply
        await asyncio.sleep(2)
        
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled")
