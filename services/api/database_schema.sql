-- ============================================================================
-- CUB Platform - Complete Database Schema
-- PostgreSQL 14+
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE - Core user information and KYC data
-- ============================================================================
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    nationality VARCHAR(50) DEFAULT 'Cameroonian',
    
    -- Address Information
    street_address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Financial Information
    occupation VARCHAR(100),
    employer_name VARCHAR(255),
    monthly_income_range VARCHAR(50),
    income_source VARCHAR(100),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_alt_phone VARCHAR(20),
    
    -- KYC Status
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'under_review')),
    kyc_verified_at TIMESTAMP,
    kyc_verified_by UUID,
    kyc_rejection_reason TEXT,
    
    -- Document Information
    id_type VARCHAR(20) CHECK (id_type IN ('CNI', 'PASSPORT')),
    id_number VARCHAR(50),
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    
    -- Liveness Verification
    liveness_verified BOOLEAN DEFAULT FALSE,
    liveness_verified_at TIMESTAMP,
    liveness_score DECIMAL(3,2),
    liveness_video_url TEXT,
    
    -- Minor/Guardian Information
    is_minor BOOLEAN DEFAULT FALSE,
    guardian_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    guardian_relationship VARCHAR(50),
    guardian_approved BOOLEAN DEFAULT FALSE,
    guardian_approved_at TIMESTAMP,
    
    -- Account Status
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'frozen', 'suspended', 'closed')),
    account_frozen_reason TEXT,
    account_frozen_at TIMESTAMP,
    account_frozen_by UUID,
    
    -- Credit & Trust Scores
    credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
    credit_score_updated_at TIMESTAMP,
    trust_score INTEGER DEFAULT 500 CHECK (trust_score >= 0 AND trust_score <= 1000),
    trust_score_updated_at TIMESTAMP,
    
    -- User Role
    user_role VARCHAR(20) DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'agent', 'guardian')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Soft Delete
    deleted_at TIMESTAMP,
    
    -- Indexes will be added below
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[0-9]{9,20}$')
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_guardian_id ON users(guardian_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- USER_FINANCIAL_DATA - SMS collection and financial metrics
-- ============================================================================
CREATE TABLE user_financial_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- SMS Data Collection Status
    sms_collection_status VARCHAR(20) DEFAULT 'pending' CHECK (sms_collection_status IN ('pending', 'collected', 'failed', 'processing')),
    sms_collection_request_id UUID,
    sms_collected_at TIMESTAMP,
    sms_collection_method VARCHAR(20) CHECK (sms_collection_method IN ('api', 'sms_parse')),
    
    -- Transaction Summary
    total_transactions INTEGER DEFAULT 0,
    total_received DECIMAL(15,2) DEFAULT 0,
    total_sent DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    average_transaction_amount DECIMAL(15,2),
    
    -- Provider Information
    has_mtn_data BOOLEAN DEFAULT FALSE,
    has_orange_data BOOLEAN DEFAULT FALSE,
    mtn_transaction_count INTEGER DEFAULT 0,
    orange_transaction_count INTEGER DEFAULT 0,
    
    -- Time Range
    earliest_transaction_date TIMESTAMP,
    latest_transaction_date TIMESTAMP,
    
    -- Behavioral Metrics
    transaction_frequency_score DECIMAL(5,2),
    balance_stability_score DECIMAL(5,2),
    income_regularity_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: One financial data record per user
    CONSTRAINT unique_user_financial_data UNIQUE(user_id)
);

CREATE INDEX idx_financial_data_user_id ON user_financial_data(user_id);
CREATE INDEX idx_financial_data_collection_status ON user_financial_data(sms_collection_status);

-- ============================================================================
-- TRANSACTIONS - Individual mobile money transactions
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RECEIVE', 'SEND', 'WITHDRAWAL', 'DEPOSIT', 'AIRTIME', 'BILL_PAYMENT', 'MERCHANT')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    balance_after DECIMAL(15,2),
    balance_before DECIMAL(15,2),
    
    -- Counterparty Information
    counterparty_name VARCHAR(255),
    counterparty_phone VARCHAR(20),
    counterparty_type VARCHAR(20) CHECK (counterparty_type IN ('person', 'merchant', 'agent', 'system')),
    
    -- Provider & Reference
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('MTN', 'ORANGE')),
    reference_number VARCHAR(100),
    
    -- SMS Source
    raw_sms_text TEXT,
    sms_sender VARCHAR(50),
    
    -- Transaction Date
    transaction_date TIMESTAMP NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_provider ON transactions(provider);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

-- ============================================================================
-- LOANS - P2P loan records
-- ============================================================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    lender_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Loan Details
    requested_amount DECIMAL(15,2) NOT NULL CHECK (requested_amount > 0),
    approved_amount DECIMAL(15,2) CHECK (approved_amount > 0),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    
    -- Purpose & Description
    loan_purpose VARCHAR(100),
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'negotiating', 'approved', 'rejected', 'disbursed', 'active', 'repaying', 'completed', 'defaulted', 'cancelled')),
    
    -- Important Dates
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    due_date DATE,
    completed_at TIMESTAMP,
    defaulted_at TIMESTAMP,
    
    -- Blockchain Integration
    blockchain_contract_address VARCHAR(255),
    blockchain_transaction_hash VARCHAR(255),
    blockchain_network VARCHAR(50),
    
    -- Repayment Info
    total_repaid DECIMAL(15,2) DEFAULT 0,
    remaining_balance DECIMAL(15,2),
    
    -- Risk Assessment
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'balanced', 'watch', 'high', 'medium', 'very_high')),
    approval_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT different_parties CHECK (borrower_id != lender_id),
    CONSTRAINT valid_approved_amount CHECK (approved_amount IS NULL OR approved_amount > 0)
);

-- Indexes for loans
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_lender_id ON loans(lender_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_created_at ON loans(created_at DESC);
CREATE INDEX idx_loans_due_date ON loans(due_date);

-- ============================================================================
-- LOAN OFFERS - Public lender marketplace offers
-- ============================================================================
CREATE TABLE loan_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    min_amount DECIMAL(15,2) NOT NULL CHECK (min_amount > 0),
    max_amount DECIMAL(15,2) NOT NULL CHECK (max_amount >= min_amount),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    risk_band VARCHAR(30) DEFAULT 'balanced',
    funding_speed VARCHAR(30) DEFAULT '24 hours',
    requirements JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loan_offers_lender_id ON loan_offers(lender_id);
CREATE INDEX idx_loan_offers_status ON loan_offers(status);
CREATE INDEX idx_loan_offers_amount_range ON loan_offers(min_amount, max_amount);

-- ============================================================================
-- LOAN NEGOTIATIONS - Borrower/lender counter-offer history
-- ============================================================================
CREATE TABLE loan_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_role VARCHAR(20) NOT NULL CHECK (actor_role IN ('borrower', 'lender')),
    offer_amount DECIMAL(15,2) NOT NULL CHECK (offer_amount > 0),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    message TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loan_negotiations_loan_id ON loan_negotiations(loan_id);
CREATE INDEX idx_loan_negotiations_actor_id ON loan_negotiations(actor_id);

-- ============================================================================
-- REPAYMENTS - Loan repayment records
-- ============================================================================
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    
    -- Repayment Details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    principal_amount DECIMAL(15,2),
    interest_amount DECIMAL(15,2),
    
    -- Dates
    due_date DATE NOT NULL,
    paid_date TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'missed', 'waived')),
    
    -- Payment Method
    payment_method VARCHAR(20) CHECK (payment_method IN ('MTN', 'ORANGE', 'cash', 'bank_transfer', 'mobile_money')),
    payment_reference VARCHAR(100),
    
    -- Late Payment
    days_overdue INTEGER DEFAULT 0,
    late_fee DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for repayments
CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_status ON repayments(status);
CREATE INDEX idx_repayments_due_date ON repayments(due_date);
CREATE INDEX idx_repayments_paid_date ON repayments(paid_date);

-- ============================================================================
-- NOTIFICATIONS - User notifications
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Related Entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery
    sent_via_push BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sent_via_email BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================================================
-- AUDIT_LOG - Track important actions
-- ============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who & What
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS - Auto-update timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_data_updated_at BEFORE UPDATE ON user_financial_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repayments_updated_at BEFORE UPDATE ON repayments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS - Useful data aggregations
-- ============================================================================

-- Active users with complete KYC
CREATE VIEW active_verified_users AS
SELECT 
    id,
    full_name,
    email,
    phone,
    kyc_status,
    liveness_verified,
    credit_score,
    trust_score,
    created_at
FROM users
WHERE 
    deleted_at IS NULL 
    AND account_status = 'active'
    AND kyc_status = 'verified'
    AND liveness_verified = TRUE;

-- Loan summary by user
CREATE VIEW user_loan_summary AS
SELECT 
    u.id AS user_id,
    u.full_name,
    COUNT(DISTINCT CASE WHEN l.borrower_id = u.id THEN l.id END) AS loans_as_borrower,
    COUNT(DISTINCT CASE WHEN l.lender_id = u.id THEN l.id END) AS loans_as_lender,
    COALESCE(SUM(CASE WHEN l.borrower_id = u.id AND l.status IN ('active', 'repaying') THEN l.approved_amount END), 0) AS total_borrowed,
    COALESCE(SUM(CASE WHEN l.lender_id = u.id AND l.status IN ('active', 'repaying') THEN l.approved_amount END), 0) AS total_lent,
    COALESCE(SUM(CASE WHEN l.borrower_id = u.id AND l.status = 'defaulted' THEN l.approved_amount END), 0) AS defaulted_amount
FROM users u
LEFT JOIN loans l ON u.id = l.borrower_id OR u.id = l.lender_id
GROUP BY u.id, u.full_name;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Comment out in production!
-- INSERT INTO users (full_name, email, phone, password_hash, date_of_birth, gender) 
-- VALUES ('Test User', 'test@cub.cm', '+237670000000', '$2b$12$...', '1990-01-01', 'Male');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
