#!/usr/bin/env python3
"""
SMS Transaction Parser for CUB Data Collection Agent
Parses MTN MOMO and Orange Money SMS notifications to extract transaction data
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from enum import Enum


class TransactionType(Enum):
    """Transaction types extracted from SMS"""
    RECEIVE = "RECEIVE"
    SEND = "SEND"
    WITHDRAWAL = "WITHDRAWAL"
    DEPOSIT = "DEPOSIT"
    AIRTIME = "AIRTIME"
    BILL_PAYMENT = "BILL_PAYMENT"
    MERCHANT = "MERCHANT"
    UNKNOWN = "UNKNOWN"


class SMSParser:
    """Parser for MTN MOMO and Orange Money transaction SMS messages"""
    
    def __init__(self):
        """Initialize SMS parser with regex patterns for both providers"""
        
        # MTN MOMO Patterns (English)
        self.mtn_patterns = {
            'received': re.compile(
                r'(?:received|recu)\s+(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?\s+from\s+([A-Z\s]+)?\s*\(?([\+\d\s\(\)]+)?\)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'sent': re.compile(
                r'(?:sent|envoye)\s+(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?\s+to\s+([A-Z\s]+)?\s*\(?([\+\d\s\(\)]+)?\)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'withdrawal': re.compile(
                r'(?:cash\s+)?withdrawal\s+(?:of\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:at\s+)?(?:AGENT[_\s]?)?(\d+)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'deposit': re.compile(
                r'(?:cash\s+)?deposit\s+(?:of\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'airtime': re.compile(
                r'airtime\s+(?:purchase\s+)?(?:of\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'bill_payment': re.compile(
                r'(?:bill\s+)?payment\s+(?:of\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:new\s+)?balance.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
        }
        
        # Orange Money Patterns (French)
        self.orange_patterns = {
            'received': re.compile(
                r'(?:avez\s+)?re[cç]u\s+(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?\s+de\s+([A-Z\s]+)?\s*\(?([\+\d\s\(\)]+)?\)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'sent': re.compile(
                r'transfert\s+(?:de\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?\s+vers\s+([A-Z\s]+)?\s*\(?([\+\d\s\(\)]+)?\)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'withdrawal': re.compile(
                r'retrait\s+(?:de\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'deposit': re.compile(
                r'd[eé]p[oô]t\s+(?:de\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'airtime': re.compile(
                r'(?:achat\s+)?cr[eé]dit\s+(?:de\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
            'bill_payment': re.compile(
                r'paiement\s+(?:de\s+)?(?:(?:FCFA|XAF|CFA)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(?:FCFA|XAF|CFA)?.*?(?:nouveau\s+)?solde.*?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)',
                re.IGNORECASE
            ),
        }
        
        # Reference number pattern (both providers)
        self.ref_pattern = re.compile(
            r'(?:ref|reference|r[eé]f[eé]rence)[\s:]+([A-Z0-9\.-]+)',
            re.IGNORECASE
        )
        
        # Provider detection
        self.mtn_sender_pattern = re.compile(r'MTN|MOMO', re.IGNORECASE)
        self.orange_sender_pattern = re.compile(r'ORANGE', re.IGNORECASE)
    
    def clean_amount(self, amount_str: str) -> float:
        """
        Clean and convert amount string to float
        Examples: "15,000" -> 15000.0, "1 500" -> 1500.0
        """
        if not amount_str:
            return 0.0
        
        # Remove all spaces and commas
        cleaned = amount_str.replace(',', '').replace(' ', '').strip()
        
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    
    def clean_phone(self, phone_str: Optional[str]) -> Optional[str]:
        """Clean phone number string"""
        if not phone_str:
            return None
        
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d\+]', '', phone_str)
        
        # Ensure it starts with +237 if it's a valid Cameroon number
        if cleaned and not cleaned.startswith('+'):
            if cleaned.startswith('237'):
                cleaned = '+' + cleaned
            elif len(cleaned) == 9:  # Local format
                cleaned = '+237' + cleaned
        
        return cleaned if cleaned else None
    
    def detect_provider(self, sender: str, message: str) -> str:
        """Detect if message is from MTN or Orange"""
        if self.mtn_sender_pattern.search(sender) or self.mtn_sender_pattern.search(message):
            return "MTN"
        elif self.orange_sender_pattern.search(sender) or self.orange_sender_pattern.search(message):
            return "ORANGE"
        return "UNKNOWN"
    
    def extract_reference(self, message: str) -> Optional[str]:
        """Extract reference number from message"""
        match = self.ref_pattern.search(message)
        return match.group(1) if match else None
    
    def parse_mtn_sms(self, message: str) -> Optional[Dict]:
        """Parse MTN MOMO SMS message"""
        
        for trans_type, pattern in self.mtn_patterns.items():
            match = pattern.search(message)
            
            if match:
                groups = match.groups()
                
                # Common fields
                amount = self.clean_amount(groups[0])
                balance = self.clean_amount(groups[-1])
                
                # Extract counterparty info if available
                name = None
                phone = None
                
                if trans_type in ['received', 'sent']:
                    if len(groups) >= 3:
                        name = groups[1].strip() if groups[1] else None
                        phone = self.clean_phone(groups[2]) if groups[2] else None
                elif trans_type == 'withdrawal':
                    if len(groups) >= 2 and groups[1]:
                        name = f"AGENT_{groups[1]}"
                
                return {
                    'type': trans_type.upper(),
                    'amount': amount,
                    'balance_after': balance,
                    'counterparty_name': name,
                    'counterparty_phone': phone,
                    'reference': self.extract_reference(message),
                    'provider': 'MTN'
                }
        
        return None
    
    def parse_orange_sms(self, message: str) -> Optional[Dict]:
        """Parse Orange Money SMS message"""
        
        for trans_type, pattern in self.orange_patterns.items():
            match = pattern.search(message)
            
            if match:
                groups = match.groups()
                
                # Common fields
                amount = self.clean_amount(groups[0])
                balance = self.clean_amount(groups[-1])
                
                # Extract counterparty info if available
                name = None
                phone = None
                
                if trans_type in ['received', 'sent']:
                    if len(groups) >= 3:
                        name = groups[1].strip() if groups[1] else None
                        phone = self.clean_phone(groups[2]) if groups[2] else None
                
                return {
                    'type': trans_type.upper(),
                    'amount': amount,
                    'balance_after': balance,
                    'counterparty_name': name,
                    'counterparty_phone': phone,
                    'reference': self.extract_reference(message),
                    'provider': 'ORANGE'
                }
        
        return None
    
    def parse_sms(self, sender: str, message: str, timestamp: Optional[datetime] = None) -> Optional[Dict]:
        """
        Parse a single SMS message and extract transaction data
        
        Args:
            sender: SMS sender (e.g., "MTN MOMO", "Orange Money")
            message: SMS message body
            timestamp: Message timestamp (optional)
        
        Returns:
            Dict with transaction data or None if not parseable
        """
        provider = self.detect_provider(sender, message)
        
        # Try to parse based on detected provider
        transaction_data = None
        
        if provider == "MTN":
            transaction_data = self.parse_mtn_sms(message)
        elif provider == "ORANGE":
            transaction_data = self.parse_orange_sms(message)
        
        if transaction_data:
            # Add metadata
            transaction_data['raw_message'] = message
            transaction_data['sender'] = sender
            transaction_data['timestamp'] = timestamp.isoformat() if timestamp else datetime.now().isoformat()
            
            return transaction_data
        
        return None
    
    def parse_sms_batch(self, sms_messages: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Parse multiple SMS messages
        
        Args:
            sms_messages: List of dicts with 'sender', 'message', 'timestamp'
        
        Returns:
            Tuple of (successfully_parsed, failed_to_parse)
        """
        parsed = []
        failed = []
        
        for sms in sms_messages:
            result = self.parse_sms(
                sender=sms.get('sender', ''),
                message=sms.get('message', ''),
                timestamp=sms.get('timestamp')
            )
            
            if result:
                parsed.append(result)
            else:
                failed.append(sms)
        
        return parsed, failed
    
    def generate_transaction_summary(self, transactions: List[Dict]) -> Dict:
        """Generate summary statistics from parsed transactions"""
        
        if not transactions:
            return {
                'total_transactions': 0,
                'total_received': 0,
                'total_sent': 0,
                'net_balance': 0,
                'providers': []
            }
        
        total_received = sum(
            t['amount'] for t in transactions 
            if t['type'] in ['RECEIVED', 'DEPOSIT']
        )
        
        total_sent = sum(
            t['amount'] for t in transactions 
            if t['type'] in ['SENT', 'WITHDRAWAL', 'AIRTIME', 'BILL_PAYMENT', 'MERCHANT']
        )
        
        providers = list(set(t['provider'] for t in transactions))
        
        # Get latest balance (most recent transaction)
        latest_balance = transactions[0]['balance_after'] if transactions else 0
        
        return {
            'total_transactions': len(transactions),
            'total_received': total_received,
            'total_sent': total_sent,
            'net_balance': total_received - total_sent,
            'current_balance': latest_balance,
            'providers': providers,
            'date_range': {
                'earliest': min(t['timestamp'] for t in transactions),
                'latest': max(t['timestamp'] for t in transactions)
            }
        }


# Standalone testing
if __name__ == "__main__":
    parser = SMSParser()
    
    # Test messages
    test_messages = [
        {
            'sender': 'MTN MOMO',
            'message': 'MTN MOMO: You have received 15,000 FCFA from JEAN PAUL (+237654123456). Your new balance is 45,000 FCFA. Ref: MT240424.1234.A5678',
            'timestamp': datetime.now()
        },
        {
            'sender': 'MTN',
            'message': 'You have sent 8,500 FCFA to MARIE NGONO (+237698765432). Your new balance is 36,500 FCFA. Ref: MT240424.5678.B9012',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Orange Money',
            'message': 'Orange Money: Vous avez reçu 25,000 FCFA de GRACE FOTSO (+237677123456). Nouveau solde: 61,500 FCFA. Réf: OM240424123456',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Orange',
            'message': 'Transfert de 12,000 FCFA vers SAMUEL KAMGA (+237690654321) réussi. Nouveau solde: 49,500 FCFA. Réf: OM240424654321',
            'timestamp': datetime.now()
        },
        {
            'sender': 'MTN MOMO',
            'message': 'Cash withdrawal of 20,000 FCFA successful at AGENT_458. Your new balance is 29,500 FCFA. Ref: MT240424.9012.C3456',
            'timestamp': datetime.now()
        },
        {
            'sender': 'Orange',
            'message': 'Retrait de 15,000 FCFA effectué. Nouveau solde: 14,500 FCFA. Réf: OM240424987654',
            'timestamp': datetime.now()
        }
    ]
    
    print("🧪 Testing SMS Parser\n")
    print("=" * 60)
    
    parsed, failed = parser.parse_sms_batch(test_messages)
    
    print(f"\n✅ Successfully parsed: {len(parsed)}/{len(test_messages)}")
    print(f"❌ Failed to parse: {len(failed)}/{len(test_messages)}\n")
    
    for i, transaction in enumerate(parsed, 1):
        print(f"\n📱 Transaction {i}:")
        print(f"   Provider: {transaction['provider']}")
        print(f"   Type: {transaction['type']}")
        print(f"   Amount: {transaction['amount']:,.0f} FCFA")
        print(f"   Balance: {transaction['balance_after']:,.0f} FCFA")
        if transaction['counterparty_name']:
            print(f"   Counterparty: {transaction['counterparty_name']}")
        if transaction['counterparty_phone']:
            print(f"   Phone: {transaction['counterparty_phone']}")
        print(f"   Reference: {transaction['reference']}")
    
    # Generate summary
    summary = parser.generate_transaction_summary(parsed)
    print(f"\n{'=' * 60}")
    print("📊 SUMMARY:")
    print(f"   Total Transactions: {summary['total_transactions']}")
    print(f"   Total Received: {summary['total_received']:,.0f} FCFA")
    print(f"   Total Sent: {summary['total_sent']:,.0f} FCFA")
    print(f"   Net Balance: {summary['net_balance']:,.0f} FCFA")
    print(f"   Current Balance: {summary['current_balance']:,.0f} FCFA")
    print(f"   Providers: {', '.join(summary['providers'])}")
    print("=" * 60)
