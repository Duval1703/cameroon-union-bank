#!/bin/bash

echo "======================================================================"
echo "  🏦 CUB SMS Data Collection Agent - Startup Script"
echo "======================================================================"
echo ""
echo "  📱 Mechanism 2: SMS-Based Data Collection"
echo "  Fallback when direct API access to MTN/Orange is unavailable"
echo ""
echo "======================================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3 and try again"
    exit 1
fi

# Check if required Python packages are installed
echo "📦 Checking dependencies..."
python3 -c "import fastapi, pydantic, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Missing dependencies detected"
    echo "Installing required packages..."
    pip3 install fastapi pydantic uvicorn httpx
fi

echo "✅ Dependencies OK"
echo ""

# Start the SMS Collection Agent
echo "🚀 Starting SMS Data Collection Agent..."
echo ""
echo "   Dashboard: http://localhost:8004"
echo "   API Docs:  http://localhost:8004/docs"
echo ""
echo "======================================================================"
echo ""

python3 sms_collection_agent.py
