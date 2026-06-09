"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Any, Dict, List, Optional
from datetime import datetime, date
from uuid import UUID

# ============================================================================
# User Schemas
# ============================================================================

class UserRegistration(BaseModel):
    """Complete user registration data from mobile app"""
    
    # Personal Information
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., pattern=r'^\+?[0-9]{9,20}$')
    password: str = Field(..., min_length=8, max_length=72)
    date_of_birth: str  # Will be converted to date
    gender: str = Field(..., pattern=r'^(Male|Female|Other)$')
    nationality: str = Field(default='Cameroonian')
    
    # Address Information
    street_address: str
    city: str
    region: str
    postal_code: Optional[str] = None
    
    # Financial Information
    occupation: str
    employer_name: Optional[str] = None
    monthly_income_range: str
    income_source: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: str
    emergency_contact_relationship: str
    emergency_contact_phone: str
    emergency_contact_alt_phone: Optional[str] = None
    
    # Document Information
    id_type: str = Field(..., pattern=r'^(CNI|PASSPORT)$')
    id_number: str
    
    # Minor/Guardian
    is_minor: bool = False
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_relationship: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "phone": "+237670123456",
                "password": "SecurePass123",
                "date_of_birth": "1995-01-15",
                "gender": "Male",
                "nationality": "Cameroonian",
                "street_address": "123 Main St",
                "city": "Douala",
                "region": "Littoral",
                "occupation": "Engineer",
                "monthly_income_range": "250,000 - 500,000 FCFA",
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_relationship": "Sister",
                "emergency_contact_phone": "+237670987654",
                "id_type": "CNI",
                "id_number": "123456789",
                "is_minor": False
            }
        }


class UserLogin(BaseModel):
    """User login credentials"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User data response (without sensitive info)"""
    id: UUID
    full_name: str
    email: str
    phone: str
    kyc_status: str
    liveness_verified: bool
    credit_score: Optional[int]
    trust_score: int
    is_minor: bool
    account_status: str
    user_role: Optional[str] = "user"
    created_at: datetime
    # Image URLs for displaying in UI
    id_front_url: Optional[str] = None
    id_back_url: Optional[str] = None
    selfie_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None
    user_id: Optional[UUID] = None


# ============================================================================
# Liveness Verification Schemas
# ============================================================================

class LivenessVerification(BaseModel):
    """Liveness verification data"""
    user_id: UUID
    liveness_score: float = Field(..., ge=0, le=1)
    video_url: Optional[str] = None
    verified: bool


# ============================================================================
# Financial Data Schemas
# ============================================================================

class SMSDataSubmission(BaseModel):
    """SMS data collection submission"""
    user_id: UUID
    request_id: UUID
    total_transactions: int
    total_received: float
    total_sent: float
    current_balance: float
    has_mtn_data: bool
    has_orange_data: bool
    mtn_transaction_count: int
    orange_transaction_count: int


class TransactionCreate(BaseModel):
    """Create a new transaction record"""
    user_id: UUID
    transaction_type: str
    amount: float
    balance_after: Optional[float]
    counterparty_name: Optional[str]
    counterparty_phone: Optional[str]
    provider: str
    reference_number: Optional[str]
    transaction_date: datetime


# ============================================================================
# Loan Schemas
# ============================================================================

class LoanRequest(BaseModel):
    """Create a new loan request"""
    requested_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    duration_months: int = Field(..., gt=0)
    loan_purpose: Optional[str] = None
    description: Optional[str] = None


class LoanOfferCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    min_amount: float = Field(..., gt=0)
    max_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    duration_months: int = Field(..., gt=0)
    risk_band: str = "balanced"
    funding_speed: str = "24 hours"
    requirements: List[str] = Field(default_factory=list)

    @validator("max_amount")
    def max_amount_must_cover_min(cls, value, values):
        min_amount = values.get("min_amount")
        if min_amount is not None and value < min_amount:
            raise ValueError("max_amount must be greater than or equal to min_amount")
        return value


class LoanOfferResponse(BaseModel):
    id: UUID
    lender_id: UUID
    title: str
    min_amount: float
    max_amount: float
    interest_rate: float
    duration_months: int
    risk_band: str
    funding_speed: str
    requirements: List[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoanNegotiationCreate(BaseModel):
    offer_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    duration_months: int = Field(..., gt=0)
    message: Optional[str] = None


class LoanNegotiationResponse(BaseModel):
    id: UUID
    loan_id: UUID
    actor_id: UUID
    actor_role: str
    offer_amount: float
    interest_rate: float
    duration_months: int
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoanFundingCreate(BaseModel):
    approved_amount: float = Field(..., gt=0)
    interest_rate: Optional[float] = Field(default=None, ge=0)
    duration_months: Optional[int] = Field(default=None, gt=0)


class LoanResponse(BaseModel):
    """Loan data response"""
    id: UUID
    borrower_id: UUID
    lender_id: Optional[UUID]
    requested_amount: float
    approved_amount: Optional[float]
    interest_rate: float
    duration_months: int
    loan_purpose: Optional[str] = None
    description: Optional[str] = None
    status: str
    requested_at: datetime
    due_date: Optional[date] = None
    total_repaid: Optional[float] = 0
    remaining_balance: Optional[float] = None
    risk_level: Optional[str] = None
    approval_score: Optional[float] = None
    
    class Config:
        from_attributes = True


class RepaymentResponse(BaseModel):
    id: UUID
    loan_id: UUID
    amount: float
    principal_amount: Optional[float]
    interest_amount: Optional[float]
    due_date: date
    paid_date: Optional[datetime]
    status: str
    payment_method: Optional[str]
    payment_reference: Optional[str]
    days_overdue: int
    late_fee: float

    class Config:
        from_attributes = True


class RepaymentPaymentCreate(BaseModel):
    payment_method: str = Field(..., pattern=r'^(MTN|ORANGE|cash|bank_transfer|mobile_money)$')
    payment_reference: str = Field(..., min_length=3, max_length=100)


class GuardianRequestCreate(BaseModel):
    guardian_name: str = Field(..., min_length=2, max_length=255)
    guardian_phone: str = Field(..., min_length=9, max_length=20)
    guardian_email: Optional[EmailStr] = None
    guardian_relationship: str = Field(..., min_length=2, max_length=50)


class GuardianDependentResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str
    guardian_relationship: Optional[str]
    guardian_approved: bool
    kyc_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LenderAnalyticsResponse(BaseModel):
    active_loans: int
    completed_loans: int
    defaulted_loans: int
    total_lent: float
    total_repaid: float
    outstanding_balance: float
    expected_interest: float
    average_interest_rate: float
    risk_alerts: List[Dict[str, Any]]
    borrower_performance: List[Dict[str, Any]]


# ============================================================================
# Notification Schemas
# ============================================================================

class NotificationCreate(BaseModel):
    """Create a notification"""
    user_id: UUID
    type: str
    title: str
    message: str
    priority: str = "normal"
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None


class NotificationResponse(BaseModel):
    """Notification response"""
    id: UUID
    type: str
    title: str
    message: str
    read: bool
    priority: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Merchant Record Schemas
# ============================================================================

class SaleRecordCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str = "cash"
    item_note: Optional[str] = None
    category: Optional[str] = "General"
    customer_name: Optional[str] = None
    record_date: Optional[datetime] = None


class SaleRecordResponse(BaseModel):
    id: UUID
    amount: float
    payment_method: str
    item_note: Optional[str]
    category: Optional[str]
    customer_name: Optional[str]
    record_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseRecordCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = "Other"
    note: Optional[str] = None
    payment_method: str = "cash"
    record_date: Optional[datetime] = None


class ExpenseRecordResponse(BaseModel):
    id: UUID
    amount: float
    category: str
    note: Optional[str]
    payment_method: str
    record_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class StockRecordCreate(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=255)
    supplier: Optional[str] = None
    quantity: float = Field(default=1, gt=0)
    unit: str = "unit"
    purchase_cost: float = Field(..., gt=0)
    record_date: Optional[datetime] = None


class StockRecordResponse(BaseModel):
    id: UUID
    item_name: str
    supplier: Optional[str]
    quantity: float
    unit: str
    purchase_cost: float
    record_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class RecordsSummaryResponse(BaseModel):
    sales_today: float
    expenses_today: float
    stock_today: float
    profit_today: float
    sales_count_today: int
    expenses_count_today: int
    stock_count_today: int
    sales_week: float
    expenses_week: float
    stock_week: float
    profit_week: float
    recent_activity: List[Dict[str, Any]]


class ReceiptVerificationCreate(BaseModel):
    image_base64: str
    filename: str = "receipt.jpg"
    content_type: str = "image/jpeg"
    supplier: Optional[str] = None
    amount: Optional[float] = None
    receipt_date: Optional[datetime] = None


class ReceiptManualVerificationCreate(BaseModel):
    supplier: Optional[str] = None
    amount: float = Field(..., gt=0)
    receipt_date: Optional[datetime] = None


class ReceiptVerificationResponse(BaseModel):
    id: UUID
    image_url: Optional[str]
    supplier: Optional[str]
    amount: float
    receipt_date: Optional[datetime]
    verdict: str
    confidence: float
    reason: Optional[str]
    extracted_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryPhotoDigitalizeCreate(BaseModel):
    image_base64: str
    filename: str = "inventory.jpg"
    content_type: str = "image/jpeg"
    note: Optional[str] = None


class InventoryVoiceDigitalizeCreate(BaseModel):
    transcript: str = Field(..., min_length=3)
    language_hint: Optional[str] = None


class InventoryStructuredItem(BaseModel):
    item_name: str
    category: Optional[str] = None
    record_date: Optional[str] = None
    quantity: float = 1
    unit: str = "unit"
    unit_price: Optional[float] = None
    total_value: Optional[float] = None
    estimated_value: float = 0
    action: str = "review"
    confidence: float = 0


class InventoryTableCreate(BaseModel):
    title: Optional[str] = "Inventory table"
    source: str = "reviewed"
    table_date: Optional[datetime] = None
    columns: List[str] = Field(default_factory=list)
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    raw_text: Optional[str] = None
    image_url: Optional[str] = None
    linked_sales_count: int = 0
    linked_stock_count: int = 0


class InventoryTableResponse(BaseModel):
    id: UUID
    title: str
    source: str
    table_date: datetime
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    total_quantity: float
    total_value: float
    linked_sales_count: int
    linked_stock_count: int
    raw_text: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryDigitalizeResponse(BaseModel):
    source: str
    message: str
    language: Optional[str] = None
    image_url: Optional[str] = None
    transcript: Optional[str] = None
    extracted_text: Optional[str] = None
    structured_table: Optional[Dict[str, Any]] = None
    items: List[InventoryStructuredItem] = Field(default_factory=list)
    sales_created: List[SaleRecordResponse] = Field(default_factory=list)
    stock_created: List[StockRecordResponse] = Field(default_factory=list)


class TrustScoreResponse(BaseModel):
    score: int
    rating_tier: str
    breakdown: List[Dict[str, Any]]
    explanations: List[str]
    history: List[Dict[str, Any]]


class StatisticsResponse(BaseModel):
    period: str
    sales: float
    expenses: float
    stock_cost: float
    profit: float
    sales_count: int
    expenses_count: int
    stock_count: int
    category_totals: List[Dict[str, Any]]
    trend: List[Dict[str, Any]]


class PredictionsResponse(BaseModel):
    predicted_sales_next_week: float
    predicted_expenses_next_week: float
    predicted_profit_next_week: float
    confidence: float
    recommendations: List[str]


class UserPreferenceUpdate(BaseModel):
    language: Optional[str] = Field(default=None, pattern=r'^(en|fr|pidgin)$')
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    theme: Optional[str] = None


class UserPreferenceResponse(BaseModel):
    language: str
    push_notifications: bool
    sms_notifications: bool
    email_notifications: bool
    theme: str

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    city: Optional[str] = None
    region: Optional[str] = None
    street_address: Optional[str] = None
    occupation: Optional[str] = None
    income_source: Optional[str] = None


# ============================================================================
# Upload Schemas
# ============================================================================

class Base64ImageUpload(BaseModel):
    """Image upload payload for Expo clients that cannot reliably send multipart."""
    image_base64: str
    filename: str = "upload.jpg"
    content_type: str = "image/jpeg"
    document_type: Optional[str] = None


# ============================================================================
# Response Models
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    success: bool = False
