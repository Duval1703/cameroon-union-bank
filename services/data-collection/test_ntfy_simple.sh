#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Ntfy Notification Test Tool                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if topic is configured
TOPIC=$(python3 -c "import json; f=open('ntfy_config.json'); d=json.load(f); print(d.get('topic_name', ''))" 2>/dev/null)

if [ -z "$TOPIC" ] || [ "$TOPIC" = "YOUR_TOPIC_NAME_HERE" ]; then
    echo "❌ No topic configured in ntfy_config.json"
    exit 1
fi

echo "Topic: $TOPIC"
echo ""
echo "Sending test notification..."
echo ""

# Send test
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -d "📱 Test notification from CUB at $(date +%H:%M:%S)" ntfy.sh/$TOPIC)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Notification sent successfully!"
    echo ""
    echo "📱 CHECK YOUR PHONE NOW!"
    echo ""
    echo "If you don't see it:"
    echo "  1. Make sure ntfy app is open"
    echo "  2. Check you're subscribed to: $TOPIC"
    echo "  3. Check phone has internet"
    echo "  4. Check notification permissions for ntfy app"
else
    echo "❌ Failed to send notification"
    echo "HTTP Code: $HTTP_CODE"
fi
