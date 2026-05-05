#!/bin/bash

# CUB Data Collection Agent - Start Script
# This script starts both the MTN/Orange server and CUB agent

echo "🏦 CUB Data Collection Agent - Startup Script"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "📦 Installing dependencies..."
pip3 install -q -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies."
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Get local IP address for mobile access
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP="localhost"
fi

echo "🌐 Your computer's IP address: $LOCAL_IP"
echo ""
echo "📱 MOBILE ACCESS INSTRUCTIONS:"
echo "   1. Make sure your phone is on the same WiFi network as this computer"
echo "   2. Open your phone's browser and go to:"
echo "      http://$LOCAL_IP:8000/consent/pending"
echo "   3. This is where you'll approve data requests"
echo ""
echo "🖥️  DESKTOP ACCESS:"
echo "   • CUB Agent Dashboard: http://localhost:8001"
echo "   • MTN/Orange Server: http://localhost:8000"
echo ""
echo "=============================================="
echo "Starting servers..."
echo ""

# Create a temporary directory for logs
mkdir -p logs

# Start MTN/Orange Server in background
echo "🚀 Starting MTN/Orange Money Server (Port 8000)..."
python3 mtn_orange_server.py > logs/mtn_orange.log 2>&1 &
MTN_PID=$!

# Wait a moment for first server to start
sleep 2

# Start CUB Data Agent in background
echo "🚀 Starting CUB Data Collection Agent (Port 8001)..."
python3 cub_data_agent.py > logs/cub_agent.log 2>&1 &
CUB_PID=$!

# Wait for servers to start
sleep 3

# Check if processes are running
if ps -p $MTN_PID > /dev/null && ps -p $CUB_PID > /dev/null; then
    echo ""
    echo "✅ Both servers are running!"
    echo ""
    echo "📊 QUICK START GUIDE:"
    echo "   1. Open http://localhost:8001 in your browser"
    echo "   2. Fill in the form with a phone number (e.g., +237670123456)"
    echo "   3. Select a provider (MTN or Orange)"
    echo "   4. Click 'Request Data Collection'"
    echo "   5. On your phone, open http://$LOCAL_IP:8000/consent/pending"
    echo "   6. Click 'Approve' to send the data"
    echo "   7. Watch the data appear on the CUB dashboard!"
    echo ""
    echo "📝 Process IDs:"
    echo "   MTN/Orange Server: $MTN_PID"
    echo "   CUB Agent: $CUB_PID"
    echo ""
    echo "🛑 To stop the servers, press Ctrl+C or run:"
    echo "   kill $MTN_PID $CUB_PID"
    echo ""
    
    # Save PIDs to file for easy cleanup
    echo "$MTN_PID" > logs/mtn_pid.txt
    echo "$CUB_PID" > logs/cub_pid.txt
    
    # Keep script running and show logs
    echo "📋 Tailing logs (Ctrl+C to stop)..."
    echo "=============================================="
    tail -f logs/mtn_orange.log logs/cub_agent.log
else
    echo "❌ Failed to start servers. Check logs in ./logs/ directory"
    kill $MTN_PID $CUB_PID 2>/dev/null
    exit 1
fi

# Cleanup on exit
trap 'echo ""; echo "🛑 Stopping servers..."; kill $MTN_PID $CUB_PID 2>/dev/null; echo "✓ Servers stopped"; exit 0' INT TERM
