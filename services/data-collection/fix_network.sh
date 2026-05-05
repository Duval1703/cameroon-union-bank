#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🔧 CUB Network Connectivity Fixer                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if servers are running
echo "1️⃣  Checking if servers are running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ MTN/Orange server is running"
else
    echo "   ❌ MTN/Orange server is NOT running"
    echo "   Start it first: python3 mtn_orange_server.py &"
fi

if curl -s http://localhost:8001/collected-data > /dev/null 2>&1; then
    echo "   ✅ CUB Agent is running"
else
    echo "   ❌ CUB Agent is NOT running"
    echo "   Start it first: python3 cub_data_agent.py &"
fi

echo ""
echo "2️⃣  Checking network interfaces..."
python3 get_network_info.py

echo ""
echo "3️⃣  Testing connectivity on all interfaces..."
echo ""

# Get all IPs
IPS=$(hostname -I)

for IP in $IPS; do
    if [ "$IP" != "127.0.0.1" ]; then
        echo "Testing http://$IP:8000..."
        if curl -s -m 2 http://$IP:8000/health > /dev/null 2>&1; then
            echo "   ✅ Accessible at http://$IP:8000"
            echo ""
            echo "   📱 Try this on your phone:"
            echo "      http://$IP:8000/consent/pending"
            echo ""
        else
            echo "   ❌ Not accessible (might be firewall)"
        fi
        echo ""
    fi
done

echo "═══════════════════════════════════════════════════════════════"
echo "🔥 Firewall Fix (if needed):"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "If none of the IPs work from your phone, run:"
echo ""
echo "   sudo ufw allow 8000/tcp"
echo "   sudo ufw allow 8001/tcp"
echo ""
echo "Or temporarily disable firewall:"
echo "   sudo ufw disable"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "💡 BEST SOLUTION: Use Mobile Hotspot"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Enable Mobile Hotspot on your phone"
echo "2. Connect this computer to your phone's hotspot"
echo "3. Run: python3 get_network_info.py"
echo "4. Use the new IP address shown"
echo ""
