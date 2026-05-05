#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║       📱 Ntfy.sh Push Notifications Setup                     ║"
echo "║       CUB Data Collection Agent                               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if config exists
if [ ! -f "ntfy_config.json" ]; then
    echo "Creating ntfy_config.json..."
    cat > ntfy_config.json << 'EOF'
{
  "topic_name": "YOUR_TOPIC_NAME_HERE",
  "enabled": false
}
EOF
fi

# Check current status
TOPIC=$(python3 -c "import json; f=open('ntfy_config.json'); d=json.load(f); print(d.get('topic_name', 'NOT_SET'))" 2>/dev/null)
ENABLED=$(python3 -c "import json; f=open('ntfy_config.json'); d=json.load(f); print(d.get('enabled', False))" 2>/dev/null)

echo "═══════════════════════════════════════════════════════════════"
echo "  Current Status"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$TOPIC" = "YOUR_TOPIC_NAME_HERE" ] || [ "$TOPIC" = "NOT_SET" ]; then
    echo "⚠️  Ntfy NOT configured yet"
    echo ""
    echo "QUICK SETUP (2 Minutes):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1️⃣  Install ntfy app on your phone"
    echo "    → Play Store/App Store"
    echo "    → Search: 'ntfy'"
    echo "    → Install by Binwiederhier"
    echo ""
    echo "2️⃣  Subscribe to a topic in the app"
    echo "    → Tap '+' button"
    echo "    → Enter topic name (e.g., 'cub-consent-allan')"
    echo "    → Tap 'Subscribe'"
    echo ""
    echo "3️⃣  Test it works"
    echo ""
    read -p "    Enter your topic name: " user_topic
    
    if [ -n "$user_topic" ]; then
        echo ""
        echo "    Sending test notification to: $user_topic"
        curl -s -d "✅ Test from CUB Server! If you see this, it works!" ntfy.sh/$user_topic
        echo "    ✓ Test notification sent!"
        echo ""
        echo "    📱 Check your phone now!"
        echo ""
        read -p "    Did you receive the notification? (y/n): " got_notification
        
        if [ "$got_notification" = "y" ] || [ "$got_notification" = "Y" ]; then
            echo ""
            echo "    ✅ Great! Configuring..."
            
            # Update config
            cat > ntfy_config.json << EOF
{
  "topic_name": "$user_topic",
  "enabled": true
}
EOF
            
            echo "    ✓ Configuration saved!"
            echo ""
            echo "4️⃣  Restart the servers:"
            echo "    ./start_servers.sh"
            echo ""
            echo "5️⃣  Test the full flow:"
            echo "    → Open http://localhost:8001"
            echo "    → Request data collection"
            echo "    → Check your phone for notification!"
            echo "    → Tap 'Approve' button"
            echo "    → Done! 🎉"
        else
            echo ""
            echo "    ⚠️  Notification not received. Please check:"
            echo "    1. Ntfy app is installed"
            echo "    2. You subscribed to: $user_topic"
            echo "    3. Phone has internet connection"
            echo "    4. Topic name is spelled exactly the same"
        fi
    fi
    
elif [ "$ENABLED" = "True" ]; then
    echo "✅ Ntfy push notifications are ENABLED!"
    echo ""
    echo "Topic: $TOPIC"
    echo ""
    echo "🎯 How to test:"
    echo "  1. Make sure servers are running: ./start_servers.sh"
    echo "  2. Open dashboard: http://localhost:8001"
    echo "  3. Request data collection"
    echo "  4. Check your phone for notification!"
    echo "  5. Tap 'Approve' button"
    echo ""
    echo "Quick test:"
    echo "  curl -d 'Test message!' ntfy.sh/$TOPIC"
    
else
    echo "⚠️  Ntfy configured but DISABLED"
    echo ""
    echo "Topic: $TOPIC"
    echo ""
    echo "To enable:"
    echo "  1. Edit ntfy_config.json"
    echo '  2. Change "enabled": false to "enabled": true'
    echo "  3. Restart servers: ./start_servers.sh"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📚 Documentation"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📖 NTFY_SETUP_GUIDE.md  - Complete setup guide"
echo "  🧪 python3 ntfy_notifier.py - Test notifications"
echo ""
