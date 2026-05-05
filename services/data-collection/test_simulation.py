#!/usr/bin/env python3
"""
Test script to verify the complete data collection simulation
"""

import httpx
import time
import json

def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def main():
    print_section("🧪 CUB Data Collection Agent - Simulation Test")
    
    # Test 1: Check servers are running
    print("\n1️⃣  Checking if servers are running...")
    try:
        response = httpx.get("http://localhost:8000/health", timeout=5)
        print(f"   ✓ MTN/Orange Server: {response.json()['status']}")
    except Exception as e:
        print(f"   ✗ MTN/Orange Server not responding: {e}")
        return
    
    try:
        response = httpx.get("http://localhost:8001/collected-data", timeout=5)
        print(f"   ✓ CUB Agent: Running")
    except Exception as e:
        print(f"   ✗ CUB Agent not responding: {e}")
        return
    
    # Test 2: Request data
    print("\n2️⃣  Requesting transaction data for +237670999888...")
    try:
        response = httpx.post(
            "http://localhost:8001/request-data",
            json={
                "user_phone": "+237670999888",
                "provider": "ORANGE"
            },
            timeout=10
        )
        result = response.json()
        if result.get("success"):
            request_id = result['request_id']
            print(f"   ✓ Request created: {request_id[:20]}...")
        else:
            print(f"   ✗ Failed: {result.get('message')}")
            return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Test 3: Check pending requests
    print("\n3️⃣  Checking pending consent requests...")
    time.sleep(1)
    try:
        response = httpx.get("http://localhost:8000/api/v1/consent/list", timeout=5)
        pending = response.json()
        count = len(pending['pending_requests'])
        print(f"   ✓ Found {count} pending request(s)")
        
        if count > 0:
            latest = pending['pending_requests'][-1]
            print(f"   ℹ️  Phone: {latest['user_phone']}")
            print(f"   ℹ️  Provider: {latest['provider']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Test 4: Simulate user approval
    print("\n4️⃣  Simulating user approval on phone...")
    try:
        response = httpx.post(
            f"http://localhost:8000/consent/{request_id}/approve",
            timeout=10
        )
        result = response.json()
        if result.get("success"):
            print(f"   ✓ Data approved and sent to CUB Agent")
        else:
            print(f"   ✗ Approval failed: {result.get('message')}")
            return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Test 5: Verify data collection
    print("\n5️⃣  Verifying data was collected...")
    time.sleep(2)
    try:
        response = httpx.get("http://localhost:8001/collected-data", timeout=5)
        data = response.json()
        count = data['total_count']
        print(f"   ✓ Total datasets collected: {count}")
        
        if count > 0:
            latest = data['collected_data'][-1]
            trans_data = latest['data']
            summary = trans_data['summary']
            
            print(f"\n   📊 Latest Collection:")
            print(f"   • Provider: {trans_data['provider']}")
            print(f"   • Phone: {trans_data['user_phone']}")
            print(f"   • Period: {trans_data['data_period']}")
            print(f"   • Total Transactions: {summary['total_transactions']}")
            print(f"   • Total Received: {summary['total_received']:,} XAF")
            print(f"   • Total Sent: {summary['total_sent']:,} XAF")
            print(f"   • Current Balance: {summary['current_balance']:,} XAF")
            
            print(f"\n   📝 Sample Transactions:")
            for i, trans in enumerate(trans_data['transactions'][:3], 1):
                print(f"   {i}. {trans['type']}: {trans['description']}")
                print(f"      Amount: {trans['amount']:,} XAF | Date: {trans['date']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    print_section("✅ ALL TESTS PASSED - System Working Perfectly!")
    
    print("\n📱 Next Steps:")
    print("   1. Keep both servers running")
    print("   2. Open http://localhost:8001 in your browser")
    print("   3. Submit a data request")
    print("   4. Approve it from your phone or at:")
    print("      http://localhost:8000/consent/pending")
    print("   5. Watch the data appear in real-time!")
    print("\n")

if __name__ == "__main__":
    main()
