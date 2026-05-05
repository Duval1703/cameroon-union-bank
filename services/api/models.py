"""
SQLAlchemy ORM Models
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Personal Information
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10))
    nationality = Column(String(50), default='Cameroonian')
    
    # Address
    street_address = Column(Text)
    city = Column(String(100))
    region = Column(String(100))
    postal_code = Column(String(20))
    
    # Financial Information
    occupation = Column(String(100))
    employer_name = Column(String(255))
    monthly_income_range = Column(String(50))
    income_source = Column(String(100))
    
    # Emergency Contact
    emergency_contact_name = Column(String(255))
    emergency_contact_relationship = Column(String(50))
    emergency_contact_phone = Column(String(20))
    emergency_contact_alt_phone = Column(String(20))
    
    # KYC Status
    kyc_status = Column(String(20), default='pending')
    kyc_verified_at = Column(DateTime)
    kyc_verified_by = Column(UUID(as_uuid=True))
    kyc_rejection_reason = Column(Text)
    
    # Document Information
    id_type = Column(String(20))
    id_number = Column(String(50))
    id_front_url = Column(Text)
    id_back_url = Column(Text)
    selfie_url = Column(Text)
    
    # Liveness Verification
    liveness_verified = Column(Boolean, default=False)
    liveness_verified_at = Column(DateTime)
    liveness_score = Column(DECIMAL(3, 2))
    liveness_video_url = Column(Text)
    
    # Minor/Guardian
    is_minor = Column(Boolean, default=False)
    guardian_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    guardian_name = Column(String(255))
    guardian_phone = Column(String(20))
    guardian_email = Column(String(255))
    guardian_relationship = Column(String(50))
    guardian_approved = Column(Boolean, default=False)
    guardian_approved_at = Column(DateTime)
    
    # Account Status
    account_status = Column(String(20), default='active')
    account_frozen_reason = Column(Text)
    account_frozen_at = Column(DateTime)
    account_frozen_by = Column(UUID(as_uuid=True))
    
    # Credit & Trust Scores
    credit_score = Column(Integer)
    credit_score_updated_at = Column(DateTime)
    trust_score = Column(Integer, default=500)
    trust_score_updated_at = Column(DateTime)
    
    # User Role
    user_role = Column(String(20), default='user')
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    deleted_at = Column(DateTime)
    
    # Relationships
    financial_data = relationship("UserFinancialData", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    sales = relationship("SaleRecord", back_populates="user")
    expenses = relationship("ExpenseRecord", back_populates="user")
    stock_items = relationship("StockRecord", back_populates="user")
    receipt_verifications = relationship("ReceiptVerification", back_populates="user")
    loans_as_borrower = relationship("Loan", foreign_keys="Loan.borrower_id", back_populates="borrower")
    loans_as_lender = relationship("Loan", foreign_keys="Loan.lender_id", back_populates="lender")
    notifications = relationship("Notification", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)


class UserFinancialData(Base):
    __tablename__ = "user_financial_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    
    # SMS Collection
    sms_collection_status = Column(String(20), default='pending')
    sms_collection_request_id = Column(UUID(as_uuid=True))
    sms_collected_at = Column(DateTime)
    sms_collection_method = Column(String(20))
    
    # Transaction Summary
    total_transactions = Column(Integer, default=0)
    total_received = Column(DECIMAL(15, 2), default=0)
    total_sent = Column(DECIMAL(15, 2), default=0)
    current_balance = Column(DECIMAL(15, 2), default=0)
    average_transaction_amount = Column(DECIMAL(15, 2))
    
    # Provider Information
    has_mtn_data = Column(Boolean, default=False)
    has_orange_data = Column(Boolean, default=False)
    mtn_transaction_count = Column(Integer, default=0)
    orange_transaction_count = Column(Integer, default=0)
    
    # Time Range
    earliest_transaction_date = Column(DateTime)
    latest_transaction_date = Column(DateTime)
    
    # Behavioral Metrics
    transaction_frequency_score = Column(DECIMAL(5, 2))
    balance_stability_score = Column(DECIMAL(5, 2))
    income_regularity_score = Column(DECIMAL(5, 2))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="financial_data")


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Transaction Details
    transaction_type = Column(String(20), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    balance_after = Column(DECIMAL(15, 2))
    balance_before = Column(DECIMAL(15, 2))
    
    # Counterparty
    counterparty_name = Column(String(255))
    counterparty_phone = Column(String(20))
    counterparty_type = Column(String(20))
    
    # Provider
    provider = Column(String(20), nullable=False)
    reference_number = Column(String(100))
    
    # SMS Source
    raw_sms_text = Column(Text)
    sms_sender = Column(String(50))
    
    # Transaction Date
    transaction_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="transactions")


class SaleRecord(Base):
    __tablename__ = "sale_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    payment_method = Column(String(30), default='cash')
    item_note = Column(Text)
    category = Column(String(100), default='General')
    customer_name = Column(String(255))
    record_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    source = Column(String(30), default='manual')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sales")


class ExpenseRecord(Base):
    __tablename__ = "expense_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    category = Column(String(100), default='Other')
    note = Column(Text)
    payment_method = Column(String(30), default='cash')
    record_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    source = Column(String(30), default='manual')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="expenses")


class StockRecord(Base):
    __tablename__ = "stock_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    item_name = Column(String(255), nullable=False)
    supplier = Column(String(255))
    quantity = Column(DECIMAL(12, 2), default=1)
    unit = Column(String(50), default='unit')
    purchase_cost = Column(DECIMAL(15, 2), nullable=False)
    record_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    source = Column(String(30), default='manual')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="stock_items")


class ReceiptVerification(Base):
    __tablename__ = "receipt_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    image_url = Column(Text)
    supplier = Column(String(255))
    amount = Column(DECIMAL(15, 2), default=0)
    receipt_date = Column(DateTime)
    verdict = Column(String(30), default='pending')
    confidence = Column(DECIMAL(5, 2), default=0)
    reason = Column(Text)
    extracted_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="receipt_verifications")


class TrustScoreHistory(Base):
    __tablename__ = "trust_score_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    score = Column(Integer, nullable=False)
    rating_tier = Column(String(50))
    breakdown = Column(JSONB)
    explanations = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    language = Column(String(10), default='en')
    push_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    theme = Column(String(20), default='system')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")


class Loan(Base):
    __tablename__ = "loans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parties
    borrower_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    lender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Loan Details
    requested_amount = Column(DECIMAL(15, 2), nullable=False)
    approved_amount = Column(DECIMAL(15, 2))
    interest_rate = Column(DECIMAL(5, 2), nullable=False)
    duration_months = Column(Integer, nullable=False)
    
    # Purpose
    loan_purpose = Column(String(100))
    description = Column(Text)
    
    # Status
    status = Column(String(20), default='requested')
    
    # Dates
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    disbursed_at = Column(DateTime)
    due_date = Column(Date)
    completed_at = Column(DateTime)
    defaulted_at = Column(DateTime)
    
    # Blockchain
    blockchain_contract_address = Column(String(255))
    blockchain_transaction_hash = Column(String(255))
    blockchain_network = Column(String(50))
    
    # Repayment
    total_repaid = Column(DECIMAL(15, 2), default=0)
    remaining_balance = Column(DECIMAL(15, 2))
    
    # Risk
    risk_level = Column(String(20))
    approval_score = Column(DECIMAL(5, 2))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    borrower = relationship("User", foreign_keys=[borrower_id], back_populates="loans_as_borrower")
    lender = relationship("User", foreign_keys=[lender_id], back_populates="loans_as_lender")
    repayments = relationship("Repayment", back_populates="loan")


class Repayment(Base):
    __tablename__ = "repayments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_id = Column(UUID(as_uuid=True), ForeignKey('loans.id'), nullable=False)
    
    # Repayment Details
    amount = Column(DECIMAL(15, 2), nullable=False)
    principal_amount = Column(DECIMAL(15, 2))
    interest_amount = Column(DECIMAL(15, 2))
    
    # Dates
    due_date = Column(Date, nullable=False)
    paid_date = Column(DateTime)
    
    # Status
    status = Column(String(20), default='pending')
    
    # Payment
    payment_method = Column(String(20))
    payment_reference = Column(String(100))
    
    # Late Payment
    days_overdue = Column(Integer, default=0)
    late_fee = Column(DECIMAL(15, 2), default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    loan = relationship("Loan", back_populates="repayments")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Notification Details
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    # Related Entity
    related_entity_type = Column(String(50))
    related_entity_id = Column(UUID(as_uuid=True))
    
    # Priority
    priority = Column(String(20), default='normal')
    
    # Delivery
    sent_via_push = Column(Boolean, default=False)
    sent_via_sms = Column(Boolean, default=False)
    sent_via_email = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationship
    user = relationship("User", back_populates="notifications")
