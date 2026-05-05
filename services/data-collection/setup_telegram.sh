#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║       📱 Telegram Push Notifications Setup                    ║"
echo "║       CUB Data Collection Agent                               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if telegram config exists
if [ ! -f "telegram_config.json" ]; then
    echo "❌ telegram_config.json not found!"
    echo "   Creating template..."
    cat > telegram_config.json << 'EOF'
{
  "bot_token": "YOUR_BOT_TOKEN_HERE",
  "chat_id": "YOUR_CHAT_ID_HERE",
  "enabled": false
}
EOF
    echo "✓ Template created"
fi

# Check current config status
BOT_TOKEN=$(python3 -c "import json; f=open('telegram_config.json'); d=json.load(f); print(d.get('bot_token', 'NOT_SET'))" 2>/dev/null)
ENABLED=$(python3 -c "import json; f=open('telegram_config.json'); d=json.load(f); print(d.get('enabled', False))" 2>/dev/null)

echo "═══════════════════════════════════════════════════════════════"
echo "  Current Status"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$BOT_TOKEN" = "YOUR_BOT_TOKEN_HERE" ] || [ "$BOT_TOKEN" = "NOT_SET" ]; then
    echo "⚠️  Telegram NOT configured yet"
    echo ""
    echo "Follow these steps to enable push notifications:"
    echo ""
    echo "STEP 1: Create a Telegram Bot (2 minutes)"
    echo "───────────────────────────────────────────"
    echo "  1. Open Telegram on your phone"
    echo "  2. Search for: @BotFather"
    echo "  3. Send: /newbot"
    echo "  4. Follow instructions to create your bot"
    echo "  5. Copy the bot token you receive"
    echo ""
    echo "STEP 2: Get Your Chat ID (1 minute)"
    echo "───────────────────────────────────────────"
    echo "  Run this command and follow instructions:"
    echo ""
    echo "      python3 get_telegram_chat_id.py"
    echo ""
    echo "  The script will:"
    echo "  - Ask for your bot token"
    echo "  - Wait for you to send /start to your bot"
    echo "  - Automatically configure everything"
    echo ""
    echo "STEP 3: Restart Servers"
    echo "───────────────────────────────────────────"
    echo "  ./start_servers.sh"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📖 For detailed instructions, see: TELEGRAM_SETUP_GUIDE.md"
    echo ""
    
elif [ "$ENABLED" = "True" ]; then
    echo "✅ Telegram push notifications are ENABLED!"
    echo ""
    echo "Bot Token: ${BOT_TOKEN:0:10}..."
    echo ""
    echo "🎯 How to test:"
    echo "  1. Make sure servers are running: ./start_servers.sh"
    echo "  2. Open dashboard: http://localhost:8001"
    echo "  3. Request data collection"
    echo "  4. Check your phone for Telegram notification!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    
else
    echo "⚠️  Telegram configured but DISABLED"
    echo ""
    echo "To enable:"
    echo "  1. Edit telegram_config.json"
    echo '  2. Change "enabled": false to "enabled": true'
    echo "  3. Restart servers: ./start_servers.sh"
    echo ""
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📚 Documentation"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📖 TELEGRAM_SETUP_GUIDE.md     - Complete setup guide"
echo "  📖 PUSH_NOTIFICATION_OPTIONS.md - All notification methods"
echo "  🤖 get_telegram_chat_id.py      - Helper script"
echo ""
