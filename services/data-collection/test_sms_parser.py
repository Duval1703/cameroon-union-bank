#!/usr/bin/env python3
"""
Test suite for SMS Parser
Tests parsing of MTN MOMO and Orange Money SMS messages
"""

import sys
from datetime import datetime
from sms_parser import SMSParser


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")


def test_mtn_messages():
    """Test MTN MOMO message parsing"""
    parser = SMSParser()
    
    print_section("🧪 Testing MTN MOMO Messages")
    
    test_cases = [
        {
            'name': 'MTN - Received Money',
            'sender': 'MTN MOMO',
            'message': 'MTN MOMO: You have received 15,000 FCFA from JEAN PAUL (+237654123456). Your new balance is 45,000 FCFA. Ref: MT240424.1234.A5678',
            'expected': {
                'type': 'RECEIVED',
                'amount': 15000,
                'balance': 45000,
                'provider': 'MTN'
            }
        },
        {
            'name': 'MTN - Sent Money',
            'sender': 'MTN',
            'message': 'You have sent 8,500 FCFA to MARIE NGONO (+237698765432). Your new balance is 36,500 FCFA. Ref: MT240424.5678.B9012',
            'expected': {
                'type': 'SENT',
                'amount': 8500,
                'balance': 36500,
                'provider': 'MTN'
            }
        },
        {
            'name': 'MTN - Cash Withdrawal',
            'sender': 'MTN MOMO',
            'message': 'Cash withdrawal of 20,000 FCFA successful at AGENT_458. Your new balance is 16,500 FCFA. Ref: MT240424.9012.C3456',
            'expected': {
                'type': 'WITHDRAWAL',
                'amount': 20000,
                'balance': 16500,
                'provider': 'MTN'
            }
        },
        {
            'name': 'MTN - Airtime Purchase',
            'sender': 'MTN MOMO',
            'message': 'Airtime purchase of 2,000 FCFA successful. Your new balance is 14,500 FCFA. Ref: MT240424.3456.D7890',
            'expected': {
                'type': 'AIRTIME',
                'amount': 2000,
                'balance': 14500,
                'provider': 'MTN'
            }
        },
        {
            'name': 'MTN - Bill Payment',
            'sender': 'MTN',
            'message': 'Bill payment of 5,500 FCFA successful. Your new balance is 9,000 FCFA. Ref: MT240424.7890.E1234',
            'expected': {
                'type': 'BILL_PAYMENT',
                'amount': 5500,
                'balance': 9000,
                'provider': 'MTN'
            }
        },
        {
            'name': 'MTN - Deposit',
            'sender': 'MTN MOMO',
            'message': 'Cash deposit of 50,000 FCFA successful. Your new balance is 59,000 FCFA. Ref: MT240424.1234.F5678',
            'expected': {
                'type': 'DEPOSIT',
                'amount': 50000,
                'balance': 59000,
                'provider': 'MTN'
            }
        }
    ]
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        result = parser.parse_sms(test['sender'], test['message'], datetime.now())
        
        if result:
            expected = test['expected']
            success = (
                result['type'] == expected['type'] and
                result['amount'] == expected['amount'] and
                result['balance_after'] == expected['balance'] and
                result['provider'] == expected['provider']
            )
            
            if success:
                print(f"✅ Test {i}: {test['name']}")
                print(f"   Type: {result['type']}, Amount: {result['amount']:,.0f} FCFA, Balance: {result['balance_after']:,.0f} FCFA")
                passed += 1
            else:
                print(f"❌ Test {i}: {test['name']}")
                print(f"   Expected: {expected}")
                print(f"   Got: {result}")
                failed += 1
        else:
            print(f"❌ Test {i}: {test['name']} - FAILED TO PARSE")
            failed += 1
    
    print(f"\n📊 MTN Results: {passed} passed, {failed} failed")
    return passed, failed


def test_orange_messages():
    """Test Orange Money message parsing"""
    parser = SMSParser()
    
    print_section("🧪 Testing Orange Money Messages")
    
    test_cases = [
        {
            'name': 'Orange - Received Money',
            'sender': 'Orange Money',
            'message': 'Orange Money: Vous avez reçu 25,000 FCFA de GRACE FOTSO (+237677123456). Nouveau solde: 61,500 FCFA. Réf: OM240424123456',
            'expected': {
                'type': 'RECEIVED',
                'amount': 25000,
                'balance': 61500,
                'provider': 'ORANGE'
            }
        },
        {
            'name': 'Orange - Sent Money',
            'sender': 'Orange',
            'message': 'Transfert de 12,000 FCFA vers SAMUEL KAMGA (+237690654321) réussi. Nouveau solde: 49,500 FCFA. Réf: OM240424654321',
            'expected': {
                'type': 'SENT',
                'amount': 12000,
                'balance': 49500,
                'provider': 'ORANGE'
            }
        },
        {
            'name': 'Orange - Withdrawal',
            'sender': 'Orange Money',
            'message': 'Retrait de 15,000 FCFA effectué. Nouveau solde: 34,500 FCFA. Réf: OM240424987654',
            'expected': {
                'type': 'WITHDRAWAL',
                'amount': 15000,
                'balance': 34500,
                'provider': 'ORANGE'
            }
        },
        {
            'name': 'Orange - Deposit',
            'sender': 'Orange',
            'message': 'Dépôt de 30,000 FCFA effectué. Nouveau solde: 64,500 FCFA. Réf: OM240424111222',
            'expected': {
                'type': 'DEPOSIT',
                'amount': 30000,
                'balance': 64500,
                'provider': 'ORANGE'
            }
        },
        {
            'name': 'Orange - Airtime',
            'sender': 'Orange Money',
            'message': 'Achat crédit de 3,000 FCFA réussi. Nouveau solde: 61,500 FCFA. Réf: OM240424333444',
            'expected': {
                'type': 'AIRTIME',
                'amount': 3000,
                'balance': 61500,
                'provider': 'ORANGE'
            }
        },
        {
            'name': 'Orange - Bill Payment',
            'sender': 'Orange',
            'message': 'Paiement de 8,000 FCFA effectué. Nouveau solde: 53,500 FCFA. Réf: OM240424555666',
            'expected': {
                'type': 'BILL_PAYMENT',
                'amount': 8000,
                'balance': 53500,
                'provider': 'ORANGE'
            }
        }
    ]
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        result = parser.parse_sms(test['sender'], test['message'], datetime.now())
        
        if result:
            expected = test['expected']
            success = (
                result['type'] == expected['type'] and
                result['amount'] == expected['amount'] and
                result['balance_after'] == expected['balance'] and
                result['provider'] == expected['provider']
            )
            
            if success:
                print(f"✅ Test {i}: {test['name']}")
                print(f"   Type: {result['type']}, Amount: {result['amount']:,.0f} FCFA, Balance: {result['balance_after']:,.0f} FCFA")
                passed += 1
            else:
                print(f"❌ Test {i}: {test['name']}")
                print(f"   Expected: {expected}")
                print(f"   Got: {result}")
                failed += 1
        else:
            print(f"❌ Test {i}: {test['name']} - FAILED TO PARSE")
            failed += 1
    
    print(f"\n📊 Orange Results: {passed} passed, {failed} failed")
    return passed, failed


def test_batch_parsing():
    """Test batch parsing of mixed messages"""
    parser = SMSParser()
    
    print_section("🧪 Testing Batch Parsing")
    
    mixed_messages = [
        {
            'sender': 'MTN MOMO',
            'message': 'You have received 10,000 FCFA from JOHN DOE (+237650111222). Your new balance is 25,000 FCFA. Ref: MT001',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Orange Money',
            'message': 'Vous avez reçu 20,000 FCFA de MARIE CLAIRE (+237677333444). Nouveau solde: 45,000 FCFA. Réf: OM002',
            'timestamp': datetime.now()
        },
        {
            'sender': 'MTN',
            'message': 'You have sent 5,000 FCFA to ALICE SMITH (+237698555666). Your new balance is 20,000 FCFA. Ref: MT003',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Orange',
            'message': 'Transfert de 8,000 FCFA vers BOB MARTIN (+237690777888) réussi. Nouveau solde: 37,000 FCFA. Réf: OM004',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Unknown Sender',
            'message': 'This is not a transaction message',
            'timestamp': datetime.now()
        }
    ]
    
    parsed, failed = parser.parse_sms_batch(mixed_messages)
    
    print(f"📥 Input: {len(mixed_messages)} messages")
    print(f"✅ Successfully parsed: {len(parsed)}")
    print(f"❌ Failed to parse: {len(failed)}")
    
    print("\n📋 Parsed Transactions:")
    for i, trans in enumerate(parsed, 1):
        print(f"   {i}. [{trans['provider']}] {trans['type']}: {trans['amount']:,.0f} FCFA → Balance: {trans['balance_after']:,.0f} FCFA")
    
    # Generate summary
    summary = parser.generate_transaction_summary(parsed)
    
    print("\n📊 Summary Statistics:")
    print(f"   Total Transactions: {summary['total_transactions']}")
    print(f"   Total Received: {summary['total_received']:,.0f} FCFA")
    print(f"   Total Sent: {summary['total_sent']:,.0f} FCFA")
    print(f"   Net Balance: {summary['net_balance']:,.0f} FCFA")
    print(f"   Current Balance: {summary['current_balance']:,.0f} FCFA")
    print(f"   Providers: {', '.join(summary['providers'])}")
    
    return len(parsed), len(failed)


def test_edge_cases():
    """Test edge cases and malformed messages"""
    parser = SMSParser()
    
    print_section("🧪 Testing Edge Cases")
    
    edge_cases = [
        {
            'name': 'Missing balance',
            'sender': 'MTN',
            'message': 'You have received 10,000 FCFA from JOHN',
        },
        {
            'name': 'Missing amount',
            'sender': 'Orange',
            'message': 'Transfert vers MARIE réussi. Nouveau solde: 50,000 FCFA',
        },
        {
            'name': 'Completely invalid',
            'sender': 'Unknown',
            'message': 'Hello, this is a spam message!',
        },
        {
            'name': 'Empty message',
            'sender': 'MTN',
            'message': '',
        }
    ]
    
    for i, test in enumerate(edge_cases, 1):
        result = parser.parse_sms(test['sender'], test['message'], datetime.now())
        status = "✅ Handled gracefully" if result is None else f"⚠️ Parsed (unexpected): {result}"
        print(f"{i}. {test['name']}: {status}")


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  🧪 CUB SMS Parser - Test Suite")
    print("=" * 70)
    
    # Run all tests
    mtn_passed, mtn_failed = test_mtn_messages()
    orange_passed, orange_failed = test_orange_messages()
    batch_parsed, batch_failed = test_batch_parsing()
    
    test_edge_cases()
    
    # Final summary
    print_section("📊 FINAL RESULTS")
    
    total_passed = mtn_passed + orange_passed
    total_failed = mtn_failed + orange_failed
    total_tests = total_passed + total_failed
    
    print(f"✅ Total Passed: {total_passed}/{total_tests}")
    print(f"❌ Total Failed: {total_failed}/{total_tests}")
    print(f"📈 Success Rate: {(total_passed/total_tests*100):.1f}%")
    
    print("\n" + "=" * 70)
    
    if total_failed == 0:
        print("🎉 ALL TESTS PASSED! SMS Parser is working perfectly!")
        return 0
    else:
        print("⚠️ Some tests failed. Please review the parser logic.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
