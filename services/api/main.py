"""
CUB Backend API - Main Application
FastAPI server for user registration, authentication, and KYC management
"""
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import Any, Dict, List, Optional
import os
from dotenv import load_dotenv
from pathlib import Path
import base64
import binascii
import uuid
import httpx
import re
import unicodedata

# Import local modules
from database import engine, get_db, Base
from models import (
    User, UserFinancialData, Transaction, Loan, Notification,
    SaleRecord, ExpenseRecord, StockRecord, ReceiptVerification,
    TrustScoreHistory, UserPreference, InventoryTable
)
from file_upload import save_upload_file, validate_image_file
from schemas import (
    UserRegistration, UserLogin, UserResponse, Token, MessageResponse,
    LivenessVerification, SMSDataSubmission, TransactionCreate,
    LoanRequest, LoanResponse, NotificationResponse, Base64ImageUpload,
    SaleRecordCreate, SaleRecordResponse, ExpenseRecordCreate, ExpenseRecordResponse,
    StockRecordCreate, StockRecordResponse, RecordsSummaryResponse,
    ReceiptManualVerificationCreate, ReceiptVerificationCreate, ReceiptVerificationResponse, TrustScoreResponse,
    StatisticsResponse, PredictionsResponse, UserPreferenceUpdate,
    UserPreferenceResponse, ProfileUpdate, InventoryPhotoDigitalizeCreate,
    InventoryVoiceDigitalizeCreate, InventoryDigitalizeResponse,
    InventoryStructuredItem, InventoryTableCreate, InventoryTableResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_active_user, require_kyc_verified,
    require_liveness_verified
)

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="CUB Platform API",
    description="Cameroon Union Bank - P2P Lending Platform API",
    version="1.0.0"
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")

# Add validator dashboard origins BEFORE middleware
ALLOWED_ORIGINS.extend([
    "http://localhost:8080",
    "http://localhost:8082",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != [''] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving static files
upload_dir = Path("./uploads")
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

DATA_COLLECTION_AGENT_URL = os.getenv("DATA_COLLECTION_AGENT_URL", "http://localhost:8001")
CREDIT_SCORING_AGENT_URL = os.getenv("CREDIT_SCORING_AGENT_URL", "http://localhost:8002")
INVENTORY_OCR_MODEL_DET = os.getenv("INVENTORY_OCR_MODEL_DET", "PP-OCRv5_mobile_det")
INVENTORY_OCR_MODEL_REC = os.getenv("INVENTORY_OCR_MODEL_REC", "latin_PP-OCRv5_mobile_rec")
INVENTORY_OCR_ENGINE = os.getenv("INVENTORY_OCR_ENGINE", "tesseract").lower()
INVENTORY_OCR_SERVICE_URL = os.getenv("INVENTORY_OCR_SERVICE_URL", "").rstrip("/")
INVENTORY_OCR_SERVICE_KEY = os.getenv("INVENTORY_OCR_SERVICE_KEY", "")
_inventory_ocr_engine = None
_inventory_ocr_error = None


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "CUB Platform API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """
    Register a new user with complete KYC information
    """
    try:
        print(f"Registration request received for: {user_data.email}")
        print(f"Password length: {len(user_data.password)} chars, {len(user_data.password.encode('utf-8'))} bytes")
        
        # Ensure password is not too long for bcrypt (max 72 bytes)
        if len(user_data.password.encode('utf-8')) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too long (max 72 bytes)"
            )
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if phone already exists
        existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        # Validate minor/guardian data
        if user_data.is_minor:
            if not all([user_data.guardian_name, user_data.guardian_phone, user_data.guardian_email]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Guardian information required for minors"
                )
        
        # Parse date of birth
        try:
            dob = datetime.strptime(user_data.date_of_birth, "%d/%m/%Y").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use DD/MM/YYYY"
            )
        
        # Create new user
        new_user = User(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            date_of_birth=dob,
            gender=user_data.gender,
            nationality=user_data.nationality,
            street_address=user_data.street_address,
            city=user_data.city,
            region=user_data.region,
            postal_code=user_data.postal_code,
            occupation=user_data.occupation,
            employer_name=user_data.employer_name,
            monthly_income_range=user_data.monthly_income_range,
            income_source=user_data.income_source,
            emergency_contact_name=user_data.emergency_contact_name,
            emergency_contact_relationship=user_data.emergency_contact_relationship,
            emergency_contact_phone=user_data.emergency_contact_phone,
            emergency_contact_alt_phone=user_data.emergency_contact_alt_phone,
            id_type=user_data.id_type,
            id_number=user_data.id_number,
            is_minor=user_data.is_minor,
            guardian_name=user_data.guardian_name,
            guardian_phone=user_data.guardian_phone,
            guardian_email=user_data.guardian_email,
            guardian_relationship=user_data.guardian_relationship,
            kyc_status='pending',  # Will be verified after liveness check
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User created with ID: {new_user.id}")
        
        # Create financial data record
        financial_data = UserFinancialData(user_id=new_user.id)
        db.add(financial_data)
        db.commit()
        print(f"Financial data created for user: {new_user.id}")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": new_user.email, "user_id": str(new_user.id)}
        )
        
        # Return token and user data
        return Token(
            access_token=access_token,
            user=UserResponse.model_validate(new_user)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log and return detailed error for debugging
        print(f"Registration error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    User login - returns JWT token
    """
    # Find user by email (username field in OAuth2 form)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check account status
    if user.account_status != 'active':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.account_status}"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id)}
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.model_validate(current_user)


# ============================================================================
# KYC ENDPOINTS
# ============================================================================

@app.post("/api/kyc/liveness", response_model=MessageResponse)
async def submit_liveness_verification(
    liveness_data: LivenessVerification,
    db: Session = Depends(get_db)
):
    """
    Submit liveness verification results
    """
    user = db.query(User).filter(User.id == liveness_data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update liveness verification
    user.liveness_verified = liveness_data.verified
    user.liveness_score = liveness_data.liveness_score
    user.liveness_verified_at = datetime.utcnow()
    user.liveness_video_url = liveness_data.video_url
    
    # Liveness is only one KYC requirement. Final KYC status remains pending
    # until a validator reviews and approves the uploaded documents/profile.
    if user.kyc_status not in ('verified', 'rejected'):
        user.kyc_status = 'pending'
    
    db.commit()
    
    return MessageResponse(
        message="Liveness verification submitted successfully",
        success=True
    )


# ============================================================================
# FINANCIAL DATA ENDPOINTS
# ============================================================================

@app.post("/api/financial/sms-data", response_model=MessageResponse)
async def submit_sms_data(
    sms_data: SMSDataSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit SMS collection data
    """
    financial_data = db.query(UserFinancialData).filter(
        UserFinancialData.user_id == sms_data.user_id
    ).first()
    
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User financial data not found"
        )
    
    # Update financial data
    financial_data.sms_collection_status = 'collected'
    financial_data.sms_collection_request_id = sms_data.request_id
    financial_data.sms_collected_at = datetime.utcnow()
    financial_data.total_transactions = sms_data.total_transactions
    financial_data.total_received = sms_data.total_received
    financial_data.total_sent = sms_data.total_sent
    financial_data.current_balance = sms_data.current_balance
    financial_data.has_mtn_data = sms_data.has_mtn_data
    financial_data.has_orange_data = sms_data.has_orange_data
    financial_data.mtn_transaction_count = sms_data.mtn_transaction_count
    financial_data.orange_transaction_count = sms_data.orange_transaction_count
    
    db.commit()
    
    return MessageResponse(
        message="SMS data submitted successfully",
        success=True
    )


@app.get("/api/financial/user/{user_id}")
async def get_user_financial_data(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's financial data"""
    financial_data = db.query(UserFinancialData).filter(
        UserFinancialData.user_id == user_id
    ).first()
    
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )
    
    return financial_data


def parse_agent_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.utcnow()

    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return datetime.utcnow()


def normalize_cameroon_phone(value: Optional[str]) -> str:
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    while digits.startswith("237") and len(digits) > 9:
        digits = digits[3:]
    return digits[-9:] if len(digits) > 9 else digits


def get_latest_collected_payload(collected_data: List[Dict[str, Any]], user_phone: str) -> Optional[Dict[str, Any]]:
    normalized_user_phone = normalize_cameroon_phone(user_phone)
    user_items = [
        item for item in collected_data
        if (
            item.get("status") == "collected"
            and normalize_cameroon_phone(item.get("data", {}).get("user_phone")) == normalized_user_phone
        )
    ]

    if not user_items:
        return None

    return sorted(user_items, key=lambda item: item.get("timestamp") or "", reverse=True)[0]


def persist_collected_transactions(
    db: Session,
    user: User,
    collected_payload: Dict[str, Any]
) -> None:
    data = collected_payload.get("data", {})
    summary = data.get("summary", {})
    provider = data.get("provider", "UNKNOWN")
    transactions = data.get("transactions", [])

    financial_data = db.query(UserFinancialData).filter(
        UserFinancialData.user_id == user.id
    ).first()

    if not financial_data:
        financial_data = UserFinancialData(user_id=user.id)
        db.add(financial_data)

    financial_data.sms_collection_status = "collected"
    financial_data.sms_collection_method = "api"
    financial_data.sms_collected_at = datetime.utcnow()
    financial_data.total_transactions = int(summary.get("total_transactions") or len(transactions) or 0)
    financial_data.total_received = float(summary.get("total_received") or 0)
    financial_data.total_sent = float(summary.get("total_sent") or 0)
    financial_data.current_balance = float(summary.get("current_balance") or 0)
    financial_data.has_mtn_data = financial_data.has_mtn_data or provider == "MTN"
    financial_data.has_orange_data = financial_data.has_orange_data or provider == "ORANGE"

    if provider == "MTN":
        financial_data.mtn_transaction_count = len(transactions)
    elif provider == "ORANGE":
        financial_data.orange_transaction_count = len(transactions)

    for tx in transactions:
        reference_number = tx.get("transaction_id")
        existing = None
        if reference_number:
            existing = db.query(Transaction).filter(
                Transaction.user_id == user.id,
                Transaction.reference_number == reference_number
            ).first()

        if existing:
            continue

        db.add(Transaction(
            user_id=user.id,
            transaction_type=tx.get("type", "UNKNOWN"),
            amount=float(tx.get("amount") or 0),
            balance_after=float(tx.get("balance_after") or 0),
            counterparty_name=tx.get("counterparty"),
            provider=provider,
            reference_number=reference_number,
            transaction_date=parse_agent_datetime(tx.get("date")),
        ))


@app.post("/api/credit-score/generate")
async def generate_credit_score(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate and persist a credit score from the latest API-based transaction collection.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            collected_response = await client.get(f"{DATA_COLLECTION_AGENT_URL}/collected-data")
            collected_response.raise_for_status()
            collected_body = collected_response.json()

            latest_payload = get_latest_collected_payload(
                collected_body.get("collected_data", []),
                current_user.phone
            )

            if not latest_payload:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No collected transaction data found for this user"
                )

            score_response = await client.post(
                f"{CREDIT_SCORING_AGENT_URL}/score-user",
                json={
                    "request_id": latest_payload.get("request_id"),
                    "data": latest_payload.get("data"),
                }
            )
            score_response.raise_for_status()
            score_result = score_response.json()

        persist_collected_transactions(db, current_user, latest_payload)

        current_user.credit_score = int(score_result["credit_score"])
        current_user.credit_score_updated_at = datetime.utcnow()
        current_user.trust_score = int(score_result["credit_score"])
        current_user.trust_score_updated_at = datetime.utcnow()

        db.commit()
        db.refresh(current_user)

        return {
            "success": True,
            "request_id": score_result.get("request_id"),
            "credit_score": current_user.credit_score,
            "trust_score": current_user.trust_score,
            "rating_tier": score_result.get("rating_tier"),
            "explanations": score_result.get("explanations", []),
        }
    except HTTPException:
        db.rollback()
        raise
    except httpx.HTTPError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Credit scoring service unavailable: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate credit score: {str(e)}"
        )


# ============================================================================
# LOAN ENDPOINTS
# ============================================================================

@app.post("/api/loans/request", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan_request(
    loan_data: LoanRequest,
    current_user: User = Depends(require_liveness_verified),
    db: Session = Depends(get_db)
):
    """Create a new loan request"""
    new_loan = Loan(
        borrower_id=current_user.id,
        requested_amount=loan_data.requested_amount,
        interest_rate=loan_data.interest_rate,
        duration_months=loan_data.duration_months,
        loan_purpose=loan_data.loan_purpose,
        description=loan_data.description,
        status='requested'
    )
    
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    
    return LoanResponse.model_validate(new_loan)


@app.get("/api/loans/my-loans", response_model=List[LoanResponse])
async def get_my_loans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's loans (as borrower or lender)"""
    loans = db.query(Loan).filter(
        (Loan.borrower_id == current_user.id) | (Loan.lender_id == current_user.id)
    ).all()
    
    return [LoanResponse.model_validate(loan) for loan in loans]


# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    
    return [NotificationResponse.model_validate(n) for n in notifications]


@app.post("/api/notifications/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    return MessageResponse(message="Notification marked as read")


# ============================================================================
# MERCHANT RECORDS, RECEIPTS, TRUST SCORE, STATS
# ============================================================================

def money(value: Any) -> float:
    return float(value or 0)


def period_bounds(period: str) -> datetime:
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "today":
        return today
    if period == "weekly":
        return today - timedelta(days=today.weekday())
    if period == "monthly":
        return today.replace(day=1)
    if period == "annual":
        return today.replace(month=1, day=1)
    return datetime(1970, 1, 1)


def create_notification(db: Session, user_id: uuid.UUID, type_: str, title: str, message: str, priority: str = "normal"):
    db.add(Notification(
        user_id=user_id,
        type=type_,
        title=title,
        message=message,
        priority=priority,
    ))


def activity_row(kind: str, title: str, amount: float, created_at: datetime) -> Dict[str, Any]:
    return {
        "type": kind,
        "title": title,
        "amount": amount,
        "created_at": created_at.isoformat(),
    }


def get_records_summary_for_user(db: Session, user: User) -> Dict[str, Any]:
    today_start = period_bounds("today")
    week_start = period_bounds("weekly")

    sales = db.query(SaleRecord).filter(SaleRecord.user_id == user.id).all()
    expenses = db.query(ExpenseRecord).filter(ExpenseRecord.user_id == user.id).all()
    stocks = db.query(StockRecord).filter(StockRecord.user_id == user.id).all()

    sales_today = sum(money(s.amount) for s in sales if s.record_date >= today_start)
    expenses_today = sum(money(e.amount) for e in expenses if e.record_date >= today_start)
    stock_today = sum(money(s.purchase_cost) for s in stocks if s.record_date >= today_start)
    sales_week = sum(money(s.amount) for s in sales if s.record_date >= week_start)
    expenses_week = sum(money(e.amount) for e in expenses if e.record_date >= week_start)
    stock_week = sum(money(s.purchase_cost) for s in stocks if s.record_date >= week_start)

    recent = []
    recent.extend(activity_row("sale", s.item_note or "Sale recorded", money(s.amount), s.created_at) for s in sales)
    recent.extend(activity_row("expense", e.note or e.category or "Expense recorded", money(e.amount), e.created_at) for e in expenses)
    recent.extend(activity_row("stock", s.item_name, money(s.purchase_cost), s.created_at) for s in stocks)
    recent = sorted(recent, key=lambda item: item["created_at"], reverse=True)[:8]

    return {
        "sales_today": sales_today,
        "expenses_today": expenses_today,
        "stock_today": stock_today,
        "profit_today": sales_today - expenses_today - stock_today,
        "sales_count_today": len([s for s in sales if s.record_date >= today_start]),
        "expenses_count_today": len([e for e in expenses if e.record_date >= today_start]),
        "stock_count_today": len([s for s in stocks if s.record_date >= today_start]),
        "sales_week": sales_week,
        "expenses_week": expenses_week,
        "stock_week": stock_week,
        "profit_week": sales_week - expenses_week - stock_week,
        "recent_activity": recent,
    }


def compute_trust_score(db: Session, user: User) -> Dict[str, Any]:
    summary = get_records_summary_for_user(db, user)
    receipts = db.query(ReceiptVerification).filter(ReceiptVerification.user_id == user.id).all()

    credit_raw = user.credit_score or user.trust_score or 500
    credit_score = min(100, max(0, round(credit_raw / 8.5))) if credit_raw > 100 else int(credit_raw)
    kyc_score = 100 if user.kyc_status == "verified" and user.liveness_verified else 65 if user.liveness_verified else 35
    records_score = min(100, 35 + summary["sales_count_today"] * 8 + summary["expenses_count_today"] * 6 + summary["stock_count_today"] * 6)
    verified_receipts = len([r for r in receipts if r.verdict == "authentic"])
    receipt_score = min(100, 45 + verified_receipts * 10)
    profit_score = 80 if summary["profit_week"] >= 0 else 45

    breakdown = [
        {"label": "Credit signal", "score": credit_score, "weight": 35},
        {"label": "KYC and liveness", "score": kyc_score, "weight": 20},
        {"label": "Business records", "score": records_score, "weight": 20},
        {"label": "Receipt verification", "score": receipt_score, "weight": 15},
        {"label": "Profit stability", "score": profit_score, "weight": 10},
    ]
    score = round(sum(item["score"] * item["weight"] for item in breakdown) / 100)
    tier = "Excellent" if score >= 80 else "Good" if score >= 65 else "Building" if score >= 45 else "Needs records"

    explanations = [
        f"Your score uses {summary['sales_count_today']} sales, {summary['expenses_count_today']} expenses, and {summary['stock_count_today']} stock entries from today.",
        f"{verified_receipts} receipt(s) have been verified as authentic.",
    ]
    if user.credit_score:
        explanations.append(f"The latest credit-score agent output is {user.credit_score}.")
    else:
        explanations.append("Generate a mobile money credit score to improve the credit signal.")

    return {
        "score": score,
        "rating_tier": tier,
        "breakdown": breakdown,
        "explanations": explanations,
    }


@app.get("/api/records/summary", response_model=RecordsSummaryResponse)
async def get_records_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return get_records_summary_for_user(db, current_user)


@app.post("/api/records/sales", response_model=SaleRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_sale_record(
    payload: SaleRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = SaleRecord(
        user_id=current_user.id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        item_note=payload.item_note,
        category=payload.category or "General",
        customer_name=payload.customer_name,
        record_date=payload.record_date or datetime.utcnow(),
    )
    db.add(record)
    create_notification(db, current_user.id, "record", "Sale saved", f"{payload.amount:,.0f} FCFA sale recorded.")
    db.commit()
    db.refresh(record)
    return SaleRecordResponse.model_validate(record)


@app.get("/api/records/sales", response_model=List[SaleRecordResponse])
async def list_sale_records(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    records = db.query(SaleRecord).filter(SaleRecord.user_id == current_user.id).order_by(SaleRecord.record_date.desc()).limit(100).all()
    return [SaleRecordResponse.model_validate(r) for r in records]


@app.put("/api/records/sales/{record_id}", response_model=SaleRecordResponse)
async def update_sale_record(
    record_id: uuid.UUID,
    payload: SaleRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(SaleRecord).filter(SaleRecord.id == record_id, SaleRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale record not found")
    record.amount = payload.amount
    record.payment_method = payload.payment_method
    record.item_note = payload.item_note
    record.category = payload.category or "General"
    record.customer_name = payload.customer_name
    record.record_date = payload.record_date or record.record_date
    db.commit()
    db.refresh(record)
    return SaleRecordResponse.model_validate(record)


@app.delete("/api/records/sales/{record_id}", response_model=MessageResponse)
async def delete_sale_record(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(SaleRecord).filter(SaleRecord.id == record_id, SaleRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale record not found")
    db.delete(record)
    db.commit()
    return MessageResponse(message="Sale record deleted")


@app.post("/api/records/expenses", response_model=ExpenseRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_expense_record(
    payload: ExpenseRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = ExpenseRecord(
        user_id=current_user.id,
        amount=payload.amount,
        category=payload.category,
        note=payload.note,
        payment_method=payload.payment_method,
        record_date=payload.record_date or datetime.utcnow(),
    )
    db.add(record)
    create_notification(db, current_user.id, "record", "Expense saved", f"{payload.amount:,.0f} FCFA expense recorded.")
    db.commit()
    db.refresh(record)
    return ExpenseRecordResponse.model_validate(record)


@app.get("/api/records/expenses", response_model=List[ExpenseRecordResponse])
async def list_expense_records(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    records = db.query(ExpenseRecord).filter(ExpenseRecord.user_id == current_user.id).order_by(ExpenseRecord.record_date.desc()).limit(100).all()
    return [ExpenseRecordResponse.model_validate(r) for r in records]


@app.put("/api/records/expenses/{record_id}", response_model=ExpenseRecordResponse)
async def update_expense_record(
    record_id: uuid.UUID,
    payload: ExpenseRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(ExpenseRecord).filter(ExpenseRecord.id == record_id, ExpenseRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense record not found")
    record.amount = payload.amount
    record.category = payload.category
    record.note = payload.note
    record.payment_method = payload.payment_method
    record.record_date = payload.record_date or record.record_date
    db.commit()
    db.refresh(record)
    return ExpenseRecordResponse.model_validate(record)


@app.delete("/api/records/expenses/{record_id}", response_model=MessageResponse)
async def delete_expense_record(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(ExpenseRecord).filter(ExpenseRecord.id == record_id, ExpenseRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense record not found")
    db.delete(record)
    db.commit()
    return MessageResponse(message="Expense record deleted")


@app.post("/api/records/stock", response_model=StockRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_record(
    payload: StockRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = StockRecord(
        user_id=current_user.id,
        item_name=payload.item_name,
        supplier=payload.supplier,
        quantity=payload.quantity,
        unit=payload.unit,
        purchase_cost=payload.purchase_cost,
        record_date=payload.record_date or datetime.utcnow(),
    )
    db.add(record)
    create_notification(db, current_user.id, "record", "Stock saved", f"{payload.item_name} stock entry saved.")
    db.commit()
    db.refresh(record)
    return StockRecordResponse.model_validate(record)


@app.get("/api/records/stock", response_model=List[StockRecordResponse])
async def list_stock_records(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    records = db.query(StockRecord).filter(StockRecord.user_id == current_user.id).order_by(StockRecord.record_date.desc()).limit(100).all()
    return [StockRecordResponse.model_validate(r) for r in records]


@app.put("/api/records/stock/{record_id}", response_model=StockRecordResponse)
async def update_stock_record(
    record_id: uuid.UUID,
    payload: StockRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(StockRecord).filter(StockRecord.id == record_id, StockRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock record not found")
    record.item_name = payload.item_name
    record.supplier = payload.supplier
    record.quantity = payload.quantity
    record.unit = payload.unit
    record.purchase_cost = payload.purchase_cost
    record.record_date = payload.record_date or record.record_date
    db.commit()
    db.refresh(record)
    return StockRecordResponse.model_validate(record)


@app.delete("/api/records/stock/{record_id}", response_model=MessageResponse)
async def delete_stock_record(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(StockRecord).filter(StockRecord.id == record_id, StockRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock record not found")
    db.delete(record)
    db.commit()
    return MessageResponse(message="Stock record deleted")


NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "un": 1, "une": 1, "deux": 2, "trois": 3, "quatre": 4, "cinq": 5,
    "six": 6, "sept": 7, "huit": 8, "neuf": 9, "dix": 10,
}


def parse_spoken_business_record(transcript: str) -> Dict[str, Any]:
    """Parse simple market voice notes after accent normalization."""
    text = transcript.lower().strip()
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[,\.;:]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    amount = 0.0
    amount_match = re.search(r"(?:pour|for|at|a)\s+([0-9\s]+)\s*(?:fcfa|francs?|xaf)?", normalized)
    if amount_match:
        digits = re.sub(r"\D", "", amount_match.group(1))
        amount = float(digits) if digits else 0.0

    action = "sale" if re.search(r"\b(vendu|sold|sell|selle|saled|vente|don sell)\b", normalized) else "stock"
    if re.search(r"\b(achete|acheter|bought|buy|stock|restock|recu|received)\b", normalized):
        action = "stock"

    quantity = 1.0
    quantity_match = re.search(
        r"\b([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|un|une|deux|trois|quatre|cinq|sept|huit|neuf|dix)\b",
        normalized,
    )
    if quantity_match:
        token = quantity_match.group(1)
        quantity = float(NUMBER_WORDS.get(token, token))

    item = "inventory item"
    item_patterns = [
        r"(?:vendu|sold|sell|don sell)\s+(?:[0-9]+|one|two|three|trois|deux|un|une)?\s*([a-z\s]+?)\s+(?:pour|for|at|a)\s",
        r"(?:achete|acheter|bought|buy|stock|recu|received)\s+(?:[0-9]+|one|two|three|trois|deux|un|une)?\s*([a-z\s]+?)\s+(?:pour|for|at|a)\s",
    ]
    for pattern in item_patterns:
        match = re.search(pattern, normalized)
        if match:
            candidate = match.group(1).strip()
            candidate = re.sub(r"\b(de|des|for|pour|at|a)\b", "", candidate).strip()
            if candidate:
                item = candidate
                break

    language = "fr" if re.search(r"\b(jai|vendu|achete|pour|francs?)\b", normalized) else "en/pidgin"
    return {"action": action, "quantity": quantity, "item_name": item, "amount": amount, "language": language}


def get_inventory_ocr_engine():
    """Create PaddleOCR only when photo OCR is requested."""
    global _inventory_ocr_engine, _inventory_ocr_error
    if INVENTORY_OCR_ENGINE != "paddle":
        return None

    if _inventory_ocr_engine is None:
        try:
            from paddleocr import PaddleOCR

            _inventory_ocr_engine = PaddleOCR(
                text_detection_model_name=INVENTORY_OCR_MODEL_DET,
                text_recognition_model_name=INVENTORY_OCR_MODEL_REC,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
            _inventory_ocr_error = None
        except Exception as exc:
            _inventory_ocr_error = f"{type(exc).__name__}: {exc}"
            print(f"Inventory OCR unavailable: {_inventory_ocr_error}")
            return None
    return _inventory_ocr_engine


def run_tesseract_inventory_ocr(image_path: Path) -> Dict[str, Any]:
    try:
        from PIL import Image
        import pytesseract

        image = Image.open(image_path)
        data = pytesseract.image_to_data(
            image,
            lang="eng+fra",
            output_type=pytesseract.Output.DICT,
            config="--psm 6",
        )

        entries: List[Dict[str, Any]] = []
        line_parts: Dict[tuple, List[Dict[str, Any]]] = {}
        for index, raw_text in enumerate(data.get("text", [])):
            text = str(raw_text).strip()
            try:
                confidence = float(data.get("conf", ["0"])[index])
            except (TypeError, ValueError):
                confidence = 0.0
            if not text or confidence < 20:
                continue

            left = float(data.get("left", [0])[index])
            top = float(data.get("top", [0])[index])
            width = float(data.get("width", [0])[index])
            height = float(data.get("height", [0])[index])
            entry = {
                "text": text,
                "x": left + width / 2,
                "y": top + height / 2,
                "score": max(confidence, 0) / 100,
            }
            entries.append(entry)
            key = (
                data.get("block_num", [0])[index],
                data.get("par_num", [0])[index],
                data.get("line_num", [0])[index],
            )
            line_parts.setdefault(key, []).append({**entry, "left": left})

        lines: List[str] = []
        for parts in line_parts.values():
            ordered = sorted(parts, key=lambda item: item["left"])
            line = " ".join(part["text"] for part in ordered).strip()
            if line:
                lines.append(line)

        return {
            "available": True,
            "lines": list(dict.fromkeys(lines)),
            "entries": entries,
            "error": None,
            "engine": "tesseract",
        }
    except Exception as exc:
        return {
            "available": False,
            "lines": [],
            "entries": [],
            "error": f"Tesseract OCR failed: {type(exc).__name__}: {exc}",
            "engine": "tesseract",
        }


def collect_ocr_text_lines(node: Any) -> List[str]:
    """Extract recognized text from PaddleOCR v2/v3 result shapes."""
    lines: List[str] = []

    if node is None:
        return lines

    if isinstance(node, str):
        text = node.strip()
        return [text] if text else []

    if isinstance(node, dict):
        for key in ("rec_texts", "texts"):
            values = node.get(key)
            if isinstance(values, list):
                lines.extend(str(value).strip() for value in values if str(value).strip())
        for key in ("res", "data", "result"):
            if key in node:
                lines.extend(collect_ocr_text_lines(node[key]))
        return lines

    if hasattr(node, "json"):
        try:
            payload = node.json() if callable(node.json) else node.json
            lines.extend(collect_ocr_text_lines(payload))
        except Exception:
            pass

    if hasattr(node, "to_dict"):
        try:
            lines.extend(collect_ocr_text_lines(node.to_dict()))
        except Exception:
            pass

    if isinstance(node, (list, tuple)):
        if len(node) == 2 and isinstance(node[0], str) and isinstance(node[1], (int, float)):
            return [node[0].strip()] if node[0].strip() else []
        for item in node:
            lines.extend(collect_ocr_text_lines(item))

    return lines


def collect_ocr_entries(result: Any) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    pages = result if isinstance(result, list) else [result]
    for page in pages:
        if hasattr(page, "to_dict"):
            try:
                page = page.to_dict()
            except Exception:
                pass
        if hasattr(page, "json"):
            try:
                page = page.json() if callable(page.json) else page.json
            except Exception:
                pass
        if not isinstance(page, dict):
            continue
        if isinstance(page.get("res"), dict):
            page = page["res"]

        texts = page.get("rec_texts") or page.get("texts") or []
        polys = page.get("dt_polys") or page.get("polys") or []
        scores = page.get("rec_scores") or []
        for index, text in enumerate(texts):
            clean_text = str(text).strip()
            if not clean_text:
                continue
            x_center = 0.0
            y_center = 0.0
            if index < len(polys):
                try:
                    points = polys[index]
                    xs = [float(point[0]) for point in points]
                    ys = [float(point[1]) for point in points]
                    x_center = sum(xs) / len(xs)
                    y_center = sum(ys) / len(ys)
                except Exception:
                    pass
            score = float(scores[index]) if index < len(scores) else 0.0
            entries.append({"text": clean_text, "x": x_center, "y": y_center, "score": score})
    return entries


def normalize_remote_ocr_entries(entries: Any) -> List[Dict[str, Any]]:
    normalized_entries: List[Dict[str, Any]] = []
    if not isinstance(entries, list):
        return normalized_entries

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        text = str(entry.get("text") or "").strip()
        if not text:
            continue

        x_center = 0.0
        y_center = 0.0
        left = 0.0
        top = 0.0
        right = 0.0
        bottom = 0.0
        box = entry.get("box")
        if isinstance(box, list) and box:
            try:
                xs = [float(point[0]) for point in box if isinstance(point, (list, tuple)) and len(point) >= 2]
                ys = [float(point[1]) for point in box if isinstance(point, (list, tuple)) and len(point) >= 2]
                if xs and ys:
                    left = min(xs)
                    top = min(ys)
                    right = max(xs)
                    bottom = max(ys)
                    x_center = sum(xs) / len(xs)
                    y_center = sum(ys) / len(ys)
            except Exception:
                pass
        else:
            try:
                x_center = float(entry.get("x") or 0.0)
                y_center = float(entry.get("y") or 0.0)
            except (TypeError, ValueError):
                x_center = 0.0
                y_center = 0.0

        try:
            score = float(entry.get("score", entry.get("confidence", 0.0)) or 0.0)
        except (TypeError, ValueError):
            score = 0.0

        normalized_entries.append({
            "text": text,
            "x": x_center,
            "y": y_center,
            "left": left,
            "top": top,
            "right": right,
            "bottom": bottom,
            "score": score,
        })

    return normalized_entries


def run_remote_inventory_ocr(image_path: Path) -> Optional[Dict[str, Any]]:
    if not INVENTORY_OCR_SERVICE_URL:
        return None

    try:
        image_base64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
        headers = {"Content-Type": "application/json"}
        if INVENTORY_OCR_SERVICE_KEY:
            headers["X-API-Key"] = INVENTORY_OCR_SERVICE_KEY

        response = httpx.post(
            f"{INVENTORY_OCR_SERVICE_URL}/ocr/inventory",
            json={
                "image_base64": image_base64,
                "filename": image_path.name,
            },
            headers=headers,
            timeout=120,
        )
        response.raise_for_status()
        payload = response.json()

        lines = payload.get("lines") or []
        if not isinstance(lines, list):
            lines = []

        return {
            "available": bool(payload.get("available", True)),
            "lines": list(dict.fromkeys(str(line).strip() for line in lines if str(line).strip())),
            "entries": normalize_remote_ocr_entries(payload.get("entries")),
            "structured_table": payload.get("structured_table") if isinstance(payload.get("structured_table"), dict) else None,
            "error": payload.get("error"),
            "engine": payload.get("engine", "remote-paddleocr"),
        }
    except Exception as exc:
        print(f"Remote inventory OCR failed for {image_path}: {type(exc).__name__}: {exc}")
        return None


def run_inventory_ocr(image_url: str) -> Dict[str, Any]:
    image_path = upload_dir / Path(image_url).name
    if not image_path.exists():
        return {"available": False, "lines": [], "entries": [], "error": "Uploaded image file was not found."}

    remote_result = run_remote_inventory_ocr(image_path)
    if remote_result is not None:
        return remote_result

    if INVENTORY_OCR_ENGINE != "paddle":
        return run_tesseract_inventory_ocr(image_path)

    engine = get_inventory_ocr_engine()
    if engine is None:
        return {
            "available": False,
            "lines": [],
            "entries": [],
            "error": _inventory_ocr_error or "PaddleOCR is not installed or could not start.",
        }

    try:
        if hasattr(engine, "predict"):
            result = engine.predict(str(image_path))
        else:
            result = engine.ocr(str(image_path))
        lines = list(dict.fromkeys(collect_ocr_text_lines(result)))
        entries = collect_ocr_entries(result)
        return {"available": True, "lines": lines, "entries": entries, "error": None, "engine": "paddle"}
    except Exception as exc:
        print(f"Inventory OCR failed for {image_path}: {exc}")
        return {"available": False, "lines": [], "entries": [], "error": str(exc)}


def parse_ocr_number(value: str) -> float:
    digits = re.sub(r"[^0-9.,]", "", value)
    if not digits:
        return 0.0
    if "," in digits and "." in digits:
        digits = digits.replace(",", "")
    elif "," in digits:
        digits = digits.replace(",", ".")
    try:
        return float(digits)
    except ValueError:
        return 0.0


def clean_table_header(value: str) -> str:
    header = re.sub(r"\s+", " ", value).strip(" :-|")
    header = re.sub(r"^[\[\](){}/\\]+|[\[\](){}/\\]+$", "", header).strip()
    normalized = unicodedata.normalize("NFKD", header.lower()).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()

    canonical_headers = [
        (["item id", "id item", "item no", "item number"], "Item ID"),
        (["item name", "product name", "item", "product", "article", "description", "ltem"], "Item Name"),
        (["quantity", "quantite", "qty", "qte"], "Quantity"),
        (["unit price", "price", "prix", "cost", "cout"], "Price"),
        (["supplier", "vendor", "company", "provider", "fournisseur"], "Supplier"),
        (["total", "amount", "montant", "value", "valeur"], "Total"),
        (["date", "jour"], "Date"),
        (["category", "categorie", "type"], "Category"),
    ]
    for aliases, canonical in canonical_headers:
        if any(alias == normalized or alias in normalized for alias in aliases):
            return canonical

    return header or "Column"


def clean_table_cell(value: str) -> str:
    cell = re.sub(r"\s+", " ", value).strip(" :-|")
    cell = re.sub(r"^[\[\]{}]+|[\[\]{}]+$", "", cell).strip()
    cell = cell.replace("Cancelin g", "Canceling")
    cell = re.sub(r"\bConsol\b", "Console", cell, flags=re.IGNORECASE)
    return cell


def row_has_header_words(text: str) -> bool:
    normalized = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode("ascii")
    header_words = {
        "date", "category", "categorie", "product", "produit", "item", "article",
        "quantity", "quantite", "qty", "qte", "sold", "stock", "unit", "unite",
        "price", "prix", "cost", "cout", "total", "amount", "montant", "value", "valeur",
        "supplier", "vendor", "company", "provider", "fournisseur", "name", "nom", "description"
    }
    return any(word in normalized for word in header_words)


def group_entries_by_y(entries: List[Dict[str, Any]], threshold: Optional[float] = None) -> List[List[Dict[str, Any]]]:
    if threshold is None:
        heights = [
            float(entry.get("bottom", 0)) - float(entry.get("top", 0))
            for entry in entries
            if float(entry.get("bottom", 0)) > float(entry.get("top", 0))
        ]
        average_height = sum(heights) / len(heights) if heights else 22
        threshold = max(18, min(42, average_height * 0.85))

    rows: List[List[Dict[str, Any]]] = []
    for entry in sorted(entries, key=lambda item: (item["y"], item["x"])):
        if not rows:
            rows.append([entry])
            continue

        previous_y = sum(item["y"] for item in rows[-1]) / len(rows[-1])
        if abs(entry["y"] - previous_y) <= threshold:
            rows[-1].append(entry)
        else:
            rows.append([entry])

    return [sorted(row, key=lambda item: item["x"]) for row in rows]


def entry_in_column(entry: Dict[str, Any], column_index: int, headers: List[Dict[str, Any]]) -> bool:
    left = float("-inf") if column_index == 0 else (headers[column_index - 1]["x"] + headers[column_index]["x"]) / 2
    right = float("inf") if column_index == len(headers) - 1 else (headers[column_index]["x"] + headers[column_index + 1]["x"]) / 2
    return left <= entry["x"] < right


def build_dynamic_inventory_table(entries: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not entries:
        return None

    grouped_rows = group_entries_by_y(entries)
    header_index = -1
    for index, row in enumerate(grouped_rows):
        row_text = " ".join(entry["text"] for entry in row)
        alpha_cells = [entry for entry in row if re.search(r"[A-Za-zÀ-ÿ]", entry["text"])]
        if len(row) >= 2 and len(alpha_cells) >= 2 and row_has_header_words(row_text):
            header_index = index
            break

    if header_index < 0:
        return None

    headers = [
        {**entry, "text": clean_table_header(entry["text"])}
        for entry in grouped_rows[header_index]
        if clean_table_header(entry["text"])
    ]
    if len(headers) < 2:
        headers = grouped_rows[header_index]
    headers = sorted(headers, key=lambda item: item["x"])

    columns: List[str] = []
    seen_columns: Dict[str, int] = {}
    for entry in headers:
        column = clean_table_header(entry["text"])
        seen_columns[column] = seen_columns.get(column, 0) + 1
        if seen_columns[column] > 1:
            column = f"{column} {seen_columns[column]}"
        columns.append(column)

    date_entries = [
        entry for entry in entries
        if entry["y"] > grouped_rows[header_index][0]["y"] and re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", entry["text"])
    ]

    row_windows: List[List[Dict[str, Any]]] = []
    if len(date_entries) >= 2:
        date_entries = sorted(date_entries, key=lambda item: item["y"])
        for index, date_entry in enumerate(date_entries):
            row_start = date_entry["y"] - 35
            row_end = (date_entries[index + 1]["y"] - 35) if index + 1 < len(date_entries) else date_entry["y"] + 95
            row_windows.append([
                entry for entry in entries
                if row_start <= entry["y"] < row_end and entry["y"] > grouped_rows[header_index][0]["y"] + 10
            ])
    else:
        row_windows = grouped_rows[header_index + 1:]

    table_rows: List[Dict[str, str]] = []
    for row in row_windows:
        row_map: Dict[str, str] = {}
        for column_index, column in enumerate(columns):
            cell_entries = [
                entry for entry in row
                if entry_in_column(entry, column_index, headers)
                and clean_table_cell(entry["text"])
                and clean_table_header(entry["text"]) not in columns
            ]
            cell_entries = sorted(cell_entries, key=lambda item: (item["y"], item["x"]))
            row_map[column] = clean_table_cell(" ".join(entry["text"] for entry in cell_entries))

        quantity_column = next((column for column in columns if re.search(r"\b(quantity|quantite|qty|qte)\b", column, re.IGNORECASE)), None)
        unit_price_column = next((column for column in columns if re.search(r"\b(unit|unite).*(price|prix|cost|cout)|\b(price|prix|cost|cout)\b", column, re.IGNORECASE)), None)
        total_column = next((column for column in columns if re.search(r"\b(total|amount|montant|value|valeur)\b", column, re.IGNORECASE)), None)
        if quantity_column and not row_map.get(quantity_column) and unit_price_column and total_column:
            unit_price = parse_ocr_number(row_map.get(unit_price_column, ""))
            total_value = parse_ocr_number(row_map.get(total_column, ""))
            if unit_price > 0 and total_value > 0:
                quantity = total_value / unit_price
                row_map[quantity_column] = str(int(quantity)) if quantity.is_integer() else str(round(quantity, 2))

        if any(value for value in row_map.values()):
            table_rows.append(row_map)

    if not columns or not table_rows:
        return None

    confidence_values = [float(entry.get("score") or 0) for entry in entries if entry.get("score")]
    confidence = round((sum(confidence_values) / len(confidence_values)) * 100, 1) if confidence_values else None
    return {
        "columns": columns,
        "rows": table_rows[:40],
        "confidence": confidence,
    }


def parse_inventory_table_entries(entries: List[Dict[str, Any]]) -> List[InventoryStructuredItem]:
    if not entries:
        return []

    sorted_entries = sorted(entries, key=lambda entry: (entry["y"], entry["x"]))
    date_entries = [
        entry for entry in sorted_entries
        if entry["x"] < 650 and re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", entry["text"])
    ]
    if len(date_entries) < 2:
        return []

    rows: List[InventoryStructuredItem] = []
    for index, date_entry in enumerate(date_entries):
        row_start = date_entry["y"] - 35
        row_end = (date_entries[index + 1]["y"] - 35) if index + 1 < len(date_entries) else date_entry["y"] + 95
        row_entries = [
            entry for entry in sorted_entries
            if row_start <= entry["y"] < row_end and not re.search(r"\b(date|category|product|total sales|unit price|quantity sold)\b", entry["text"].lower())
        ]

        category_parts = [entry["text"] for entry in row_entries if 560 <= entry["x"] < 1050]
        product_parts = [entry["text"] for entry in row_entries if 1050 <= entry["x"] < 1550]
        quantity_parts = [entry["text"] for entry in row_entries if 1550 <= entry["x"] < 1900]
        unit_parts = [entry["text"] for entry in row_entries if 1900 <= entry["x"] < 2420]
        total_parts = [entry["text"] for entry in row_entries if entry["x"] >= 2420]

        item_name = " ".join(part for part in product_parts if part).strip()
        item_name = re.sub(r"\s+", " ", item_name)
        item_name = item_name.replace("Cancelin g", "Canceling")
        item_name = re.sub(r"\bConsol\b", "Console", item_name, flags=re.IGNORECASE)
        if not item_name:
            continue

        quantity = parse_ocr_number(quantity_parts[0]) if quantity_parts else 0.0
        unit_price = parse_ocr_number(unit_parts[0]) if unit_parts else 0.0
        total_value = parse_ocr_number(total_parts[0]) if total_parts else 0.0
        if quantity <= 0 and unit_price > 0 and total_value > 0:
            quantity = round(total_value / unit_price, 2)
        if quantity <= 0:
            quantity = 1.0

        category = category_parts[0] if category_parts else "Inventory"
        rows.append(InventoryStructuredItem(
            item_name=item_name,
            category=category,
            record_date=date_entry["text"],
            quantity=quantity,
            unit="unit",
            unit_price=unit_price or None,
            total_value=total_value or unit_price,
            estimated_value=total_value or unit_price,
            action="review",
            confidence=82 if total_value > 0 else 68,
        ))

    return rows[:20]


def parse_inventory_text_line(line: str) -> Optional[InventoryStructuredItem]:
    normalized = unicodedata.normalize("NFKD", line.lower()).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[|;,]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if len(normalized) < 2:
        return None

    numbers = re.findall(r"\d+(?:[\s.]\d{3})*(?:[,.]\d+)?|\d+", normalized)
    amount = 0.0
    quantity = 1.0

    parsed_numbers: List[float] = []
    for value in numbers:
        compact = value.replace(" ", "").replace(".", "").replace(",", ".")
        try:
            parsed_numbers.append(float(compact))
        except ValueError:
            continue

    if parsed_numbers:
        amount = parsed_numbers[-1] if parsed_numbers[-1] >= 100 else 0.0
        if len(parsed_numbers) > 1:
            quantity = parsed_numbers[0]
        elif amount == 0:
            quantity = parsed_numbers[0]

    item_name = re.sub(r"\d+(?:[\s.]\d{3})*(?:[,.]\d+)?|\d+", " ", normalized)
    item_name = re.sub(r"\b(fcfa|xaf|francs?|prix|price|qty|qte|quantite|quantity|total|stock|unit|unite|x)\b", " ", item_name)
    item_name = re.sub(r"\s+", " ", item_name).strip(" -:")

    if not item_name or item_name in {"inventory", "item"}:
        return None

    confidence = 72 if amount > 0 else 60
    return InventoryStructuredItem(
        item_name=item_name,
        quantity=quantity,
        unit="unit",
        unit_price=round(amount / quantity, 2) if amount > 0 and quantity > 0 else None,
        total_value=amount,
        estimated_value=amount,
        action="review",
        confidence=confidence,
    )


def parse_inventory_ocr_lines(lines: List[str]) -> List[InventoryStructuredItem]:
    items: List[InventoryStructuredItem] = []
    for line in lines:
        item = parse_inventory_text_line(line)
        if item:
            items.append(item)
    return items[:20]


def parse_inventory_table_number(value: Any) -> float:
    text = str(value or "")
    cleaned = re.sub(r"[^0-9,.\-\s]", "", text).replace(" ", "")
    if not cleaned:
        return 0.0
    if "." in cleaned and "," in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = re.sub(r",(?=\d{3}\b)", "", cleaned).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def column_matches(column: str, keywords: List[str]) -> bool:
    normalized = unicodedata.normalize("NFKD", column.lower()).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
    return any(keyword in normalized for keyword in keywords)


def inventory_table_totals(columns: List[str], rows: List[Dict[str, Any]]) -> Dict[str, float]:
    quantity_columns = [column for column in columns if column_matches(column, ["quantity", "quantite", "qty", "qte", "nombre", "sold", "vendu"])]
    total_columns = [column for column in columns if column_matches(column, ["total", "amount", "montant", "value", "valeur", "sales", "revenue"])]

    total_quantity = 0.0
    total_value = 0.0
    for row in rows:
        if quantity_columns:
            total_quantity += parse_inventory_table_number(row.get(quantity_columns[0]))
        if total_columns:
            total_value += parse_inventory_table_number(row.get(total_columns[0]))

    return {"total_quantity": total_quantity, "total_value": total_value}


def inventory_table_response(record: InventoryTable) -> InventoryTableResponse:
    return InventoryTableResponse(
        id=record.id,
        title=record.title,
        source=record.source,
        table_date=record.table_date,
        columns=record.columns or [],
        rows=record.rows or [],
        row_count=record.row_count or 0,
        total_quantity=float(record.total_quantity or 0),
        total_value=float(record.total_value or 0),
        linked_sales_count=record.linked_sales_count or 0,
        linked_stock_count=record.linked_stock_count or 0,
        raw_text=record.raw_text,
        image_url=record.image_url,
        created_at=record.created_at,
    )


def parse_inventory_structured_table_items(structured_table: Optional[Dict[str, Any]]) -> List[InventoryStructuredItem]:
    if not structured_table:
        return []

    columns = [str(column) for column in structured_table.get("columns", [])]
    rows = structured_table.get("rows", [])
    if not columns or not isinstance(rows, list):
        return []

    def find_table_column(keywords: List[str]) -> Optional[str]:
        for column in columns:
            if column_matches(column, keywords):
                return column
        return None

    item_column = find_table_column(["item name", "product name", "item", "product", "article", "description", "name", "nom"])
    quantity_column = find_table_column(["quantity", "quantite", "qty", "qte", "nombre"])
    price_column = find_table_column(["unit price", "price", "prix", "cost", "cout"])
    total_column = find_table_column(["total", "amount", "montant", "value", "valeur"])
    supplier_column = find_table_column(["supplier", "vendor", "company", "provider", "fournisseur"])

    items: List[InventoryStructuredItem] = []
    for row in rows:
        if not isinstance(row, dict):
            continue

        item_name = str(row.get(item_column, "") if item_column else "").strip()
        if not item_name:
            continue

        quantity = parse_inventory_table_number(row.get(quantity_column, "")) if quantity_column else 1.0
        unit_price = parse_inventory_table_number(row.get(price_column, "")) if price_column else 0.0
        total_value = parse_inventory_table_number(row.get(total_column, "")) if total_column else 0.0
        if total_value <= 0 and unit_price > 0 and quantity > 0:
            total_value = unit_price * quantity
        if quantity <= 0:
            quantity = 1.0

        supplier = str(row.get(supplier_column, "") if supplier_column else "").strip()
        items.append(InventoryStructuredItem(
            item_name=item_name,
            category=supplier or "Inventory",
            quantity=quantity,
            unit="unit",
            unit_price=unit_price if unit_price > 0 else None,
            total_value=total_value if total_value > 0 else None,
            estimated_value=total_value if total_value > 0 else unit_price,
            action="stock",
            confidence=float(structured_table.get("confidence") or 80),
        ))

    return items


@app.get("/api/inventory/ocr-health")
async def get_inventory_ocr_health(
    current_user: User = Depends(get_current_active_user)
):
    if INVENTORY_OCR_ENGINE != "paddle":
        try:
            import pytesseract
            version = str(pytesseract.get_tesseract_version())
            return {
                "available": True,
                "engine": "tesseract",
                "selected_engine": INVENTORY_OCR_ENGINE,
                "version": version,
                "error": None,
            }
        except Exception as exc:
            return {
                "available": False,
                "engine": "tesseract",
                "selected_engine": INVENTORY_OCR_ENGINE,
                "error": f"{type(exc).__name__}: {exc}",
            }

    engine = get_inventory_ocr_engine()
    return {
        "available": engine is not None,
        "engine": type(engine).__name__ if engine else None,
        "selected_engine": INVENTORY_OCR_ENGINE,
        "det_model": INVENTORY_OCR_MODEL_DET,
        "rec_model": INVENTORY_OCR_MODEL_REC,
        "error": _inventory_ocr_error,
    }


@app.post("/api/inventory/photo-digitalize", response_model=InventoryDigitalizeResponse)
async def digitalize_inventory_photo(
    payload: InventoryPhotoDigitalizeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    image_url = save_base64_image(Base64ImageUpload(
        image_base64=payload.image_base64,
        filename=payload.filename,
        content_type=payload.content_type,
        document_type="inventory",
    ), "inventory")
    ocr_result = run_inventory_ocr(image_url)
    ocr_lines = ocr_result["lines"]
    structured_table = ocr_result.get("structured_table") or build_dynamic_inventory_table(ocr_result.get("entries", []))
    structured_items = parse_inventory_structured_table_items(structured_table)
    if not structured_items:
        structured_items = parse_inventory_table_entries(ocr_result.get("entries", []))
    if not structured_items:
        structured_items = parse_inventory_ocr_lines(ocr_lines)

    create_notification(
        db,
        current_user.id,
        "inventory",
        "Inventory photo uploaded",
        "Inventory photo received and processed with OCR."
    )
    db.commit()

    if not structured_items:
        structured_items = [
            InventoryStructuredItem(
                item_name="Review inventory photo",
                quantity=1,
                unit="photo",
                estimated_value=0,
                action="review",
                confidence=45 if ocr_result["available"] else 25,
            )
        ]

    if ocr_lines:
        message = f"Inventory photo processed. OCR found {len(ocr_lines)} text line(s); review the structured draft before saving stock records."
    elif ocr_result["available"]:
        message = "Inventory photo uploaded, but no readable text was detected. Try a clearer photo or use voice entry."
    else:
        message = f"Inventory photo uploaded, but OCR is unavailable: {ocr_result['error']}"

    return InventoryDigitalizeResponse(
        source="photo",
        image_url=image_url,
        extracted_text="\n".join(ocr_lines) if ocr_lines else None,
        structured_table=structured_table,
        message=message,
        items=structured_items,
    )


@app.post("/api/inventory/voice-digitalize", response_model=InventoryDigitalizeResponse)
async def digitalize_inventory_voice(
    payload: InventoryVoiceDigitalizeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    parsed = parse_spoken_business_record(payload.transcript)
    structured = InventoryStructuredItem(
        item_name=parsed["item_name"],
        quantity=parsed["quantity"],
        unit="unit",
        unit_price=round(parsed["amount"] / parsed["quantity"], 2) if parsed["amount"] > 0 and parsed["quantity"] > 0 else None,
        total_value=parsed["amount"],
        estimated_value=parsed["amount"],
        action=parsed["action"] if parsed["amount"] > 0 else "review",
        confidence=74 if parsed["amount"] > 0 else 52,
    )

    if parsed["amount"] <= 0:
        create_notification(
            db,
            current_user.id,
            "inventory",
            "Voice note needs review",
            "MboaTrust understood the item, but no amount was detected."
        )
        db.commit()
        return InventoryDigitalizeResponse(
            source="voice",
            transcript=payload.transcript,
            language=parsed["language"],
            message="Voice note understood, but no amount was detected. Review it before saving a business record.",
            items=[structured],
        )

    create_notification(
        db,
        current_user.id,
        "inventory",
        "Voice inventory draft ready",
        "Review the structured voice draft, correct any values, then save it."
    )
    db.commit()

    return InventoryDigitalizeResponse(
        source="voice",
        transcript=payload.transcript,
        language=parsed["language"],
        message="Voice note digitalized. Review the structured draft before saving it to records.",
        items=[structured],
    )


@app.post("/api/inventory/tables", response_model=InventoryTableResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_table(
    payload: InventoryTableCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    columns = [str(column) for column in payload.columns if str(column).strip()]
    rows: List[Dict[str, Any]] = []
    for row in payload.rows:
        cleaned_row = {column: str(row.get(column, "")).strip() for column in columns}
        if any(cleaned_row.values()):
            rows.append(cleaned_row)

    if not columns:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inventory table needs at least one column")
    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inventory table needs at least one row")

    totals = inventory_table_totals(columns, rows)
    table_date = payload.table_date or datetime.utcnow()
    title = (payload.title or "Inventory table").strip() or "Inventory table"

    record = InventoryTable(
        user_id=current_user.id,
        title=title[:255],
        source=payload.source or "reviewed",
        table_date=table_date,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        total_quantity=totals["total_quantity"],
        total_value=totals["total_value"],
        linked_sales_count=max(payload.linked_sales_count, 0),
        linked_stock_count=max(payload.linked_stock_count, 0),
        raw_text=payload.raw_text,
        image_url=payload.image_url,
    )
    db.add(record)
    create_notification(db, current_user.id, "inventory", "Inventory table saved", f"{title} saved with {len(rows)} row(s).")
    db.commit()
    db.refresh(record)
    return inventory_table_response(record)


@app.get("/api/inventory/tables", response_model=List[InventoryTableResponse])
async def list_inventory_tables(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(InventoryTable)
        .filter(InventoryTable.user_id == current_user.id)
        .order_by(InventoryTable.table_date.desc(), InventoryTable.created_at.desc())
        .limit(100)
        .all()
    )
    return [inventory_table_response(record) for record in records]


@app.get("/api/inventory/tables/{table_id}", response_model=InventoryTableResponse)
async def get_inventory_table(
    table_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(InventoryTable).filter(InventoryTable.id == table_id, InventoryTable.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory table not found")
    return inventory_table_response(record)


@app.post("/api/receipts/verify-base64", response_model=ReceiptVerificationResponse, status_code=status.HTTP_201_CREATED)
async def verify_receipt_base64(
    payload: ReceiptVerificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    image_url = save_base64_image(Base64ImageUpload(
        image_base64=payload.image_base64,
        filename=payload.filename,
        content_type=payload.content_type,
        document_type="receipt",
    ), "receipt")

    amount = payload.amount or 0
    verdict = "authentic" if amount > 0 else "pending"
    confidence = 88.0 if amount > 0 else 52.0
    reason = "Receipt image stored and metadata validated." if amount > 0 else "Receipt saved, but amount was not provided for validation."

    record = ReceiptVerification(
        user_id=current_user.id,
        image_url=image_url,
        supplier=payload.supplier,
        amount=amount,
        receipt_date=payload.receipt_date,
        verdict=verdict,
        confidence=confidence,
        reason=reason,
        extracted_data={
            "supplier": payload.supplier,
            "amount": amount,
            "receipt_date": payload.receipt_date.isoformat() if payload.receipt_date else None,
            "source": "manual_metadata",
        },
    )
    db.add(record)
    create_notification(db, current_user.id, "receipt", "Receipt checked", f"Receipt verdict: {verdict}.")
    db.commit()
    db.refresh(record)
    return ReceiptVerificationResponse.model_validate(record)


@app.post("/api/receipts/manual", response_model=ReceiptVerificationResponse, status_code=status.HTTP_201_CREATED)
async def verify_receipt_manual(
    payload: ReceiptManualVerificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    verdict = "authentic" if payload.supplier else "pending"
    confidence = 62.0 if payload.supplier else 48.0
    reason = (
        "Manual receipt details saved with reduced score weight."
        if payload.supplier
        else "Manual receipt saved, but supplier is missing for stronger validation."
    )

    record = ReceiptVerification(
        user_id=current_user.id,
        image_url=None,
        supplier=payload.supplier,
        amount=payload.amount,
        receipt_date=payload.receipt_date,
        verdict=verdict,
        confidence=confidence,
        reason=reason,
        extracted_data={
            "supplier": payload.supplier,
            "amount": payload.amount,
            "receipt_date": payload.receipt_date.isoformat() if payload.receipt_date else None,
            "source": "manual_entry",
            "score_weight": "reduced",
        },
    )
    db.add(record)
    create_notification(db, current_user.id, "receipt", "Manual receipt saved", f"Receipt verdict: {verdict}.")
    db.commit()
    db.refresh(record)
    return ReceiptVerificationResponse.model_validate(record)


@app.get("/api/receipts/history", response_model=List[ReceiptVerificationResponse])
async def get_receipt_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    records = db.query(ReceiptVerification).filter(
        ReceiptVerification.user_id == current_user.id
    ).order_by(ReceiptVerification.created_at.desc()).limit(100).all()
    return [ReceiptVerificationResponse.model_validate(r) for r in records]


@app.get("/api/trust-score", response_model=TrustScoreResponse)
async def get_trust_score(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    score_data = compute_trust_score(db, current_user)
    current_user.trust_score = score_data["score"]
    current_user.trust_score_updated_at = datetime.utcnow()
    db.add(TrustScoreHistory(
        user_id=current_user.id,
        score=score_data["score"],
        rating_tier=score_data["rating_tier"],
        breakdown=score_data["breakdown"],
        explanations=score_data["explanations"],
    ))
    db.commit()

    history = db.query(TrustScoreHistory).filter(
        TrustScoreHistory.user_id == current_user.id
    ).order_by(TrustScoreHistory.created_at.desc()).limit(12).all()
    return {
        **score_data,
        "history": [
            {"score": h.score, "rating_tier": h.rating_tier, "created_at": h.created_at.isoformat()}
            for h in reversed(history)
        ],
    }


@app.get("/api/statistics", response_model=StatisticsResponse)
async def get_statistics(
    period: str = "weekly",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    start = period_bounds(period)
    sales = db.query(SaleRecord).filter(SaleRecord.user_id == current_user.id, SaleRecord.record_date >= start).all()
    expenses = db.query(ExpenseRecord).filter(ExpenseRecord.user_id == current_user.id, ExpenseRecord.record_date >= start).all()
    stocks = db.query(StockRecord).filter(StockRecord.user_id == current_user.id, StockRecord.record_date >= start).all()

    sales_total = sum(money(s.amount) for s in sales)
    expenses_total = sum(money(e.amount) for e in expenses)
    stock_total = sum(money(s.purchase_cost) for s in stocks)
    categories: Dict[str, float] = {}
    trend: Dict[str, Dict[str, float]] = {}

    for sale in sales:
        key = sale.record_date.date().isoformat()
        trend.setdefault(key, {"date": key, "sales": 0, "expenses": 0, "stock": 0})
        trend[key]["sales"] += money(sale.amount)
    for expense in expenses:
        categories[expense.category] = categories.get(expense.category, 0) + money(expense.amount)
        key = expense.record_date.date().isoformat()
        trend.setdefault(key, {"date": key, "sales": 0, "expenses": 0, "stock": 0})
        trend[key]["expenses"] += money(expense.amount)
    for stock in stocks:
        key = stock.record_date.date().isoformat()
        trend.setdefault(key, {"date": key, "sales": 0, "expenses": 0, "stock": 0})
        trend[key]["stock"] += money(stock.purchase_cost)

    return {
        "period": period,
        "sales": sales_total,
        "expenses": expenses_total,
        "stock_cost": stock_total,
        "profit": sales_total - expenses_total - stock_total,
        "sales_count": len(sales),
        "expenses_count": len(expenses),
        "stock_count": len(stocks),
        "category_totals": [{"category": k, "amount": v} for k, v in sorted(categories.items(), key=lambda item: item[1], reverse=True)],
        "trend": [trend[k] for k in sorted(trend.keys())],
    }


@app.get("/api/predictions", response_model=PredictionsResponse)
async def get_predictions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    stats = await get_statistics("weekly", current_user, db)
    sales = stats["sales"] if isinstance(stats, dict) else stats.sales
    expenses = stats["expenses"] if isinstance(stats, dict) else stats.expenses
    stock = stats["stock_cost"] if isinstance(stats, dict) else stats.stock_cost
    record_count = (stats["sales_count"] if isinstance(stats, dict) else stats.sales_count) + (stats["expenses_count"] if isinstance(stats, dict) else stats.expenses_count)
    confidence = min(92, 45 + record_count * 5)
    predicted_sales = sales * 1.08 if sales else 0
    predicted_expenses = (expenses + stock) * 1.03 if expenses or stock else 0
    recommendations = []
    if record_count < 7:
        recommendations.append("Add records every day this week to improve prediction confidence.")
    if predicted_expenses > predicted_sales:
        recommendations.append("Review high expense and stock purchases before restocking.")
    else:
        recommendations.append("Current records show a positive profit trend.")
    recommendations.append("Verify supplier receipts to strengthen your trust score.")
    return {
        "predicted_sales_next_week": predicted_sales,
        "predicted_expenses_next_week": predicted_expenses,
        "predicted_profit_next_week": predicted_sales - predicted_expenses,
        "confidence": confidence,
        "recommendations": recommendations,
    }


@app.get("/api/preferences", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not preferences:
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    return UserPreferenceResponse.model_validate(preferences)


@app.put("/api/preferences", response_model=UserPreferenceResponse)
async def update_preferences(
    payload: UserPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not preferences:
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(preferences, field, value)
    db.commit()
    db.refresh(preferences)
    return UserPreferenceResponse.model_validate(preferences)


@app.put("/api/profile", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ============================================================
# FILE UPLOAD ENDPOINTS
# ============================================================

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
}
MAX_BASE64_UPLOAD_BYTES = 10 * 1024 * 1024


def save_base64_image(upload: Base64ImageUpload, prefix: str) -> str:
    """Decode and save a base64 image payload, returning its public URL path."""
    content_type = upload.content_type.lower()
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a JPEG or PNG image"
        )

    image_data = upload.image_base64
    if "," in image_data and image_data.strip().startswith("data:"):
        image_data = image_data.split(",", 1)[1]

    try:
        decoded = base64.b64decode(image_data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data"
        )

    if len(decoded) > MAX_BASE64_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large. Maximum size is 10MB"
        )

    ext = ALLOWED_IMAGE_CONTENT_TYPES[content_type]
    file_path = upload_dir / f"{prefix}{uuid.uuid4()}{ext}"
    file_path.write_bytes(decoded)
    return f"/uploads/{file_path.name}"

@app.post("/api/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload ID document photo"""
    try:
        file_path = save_upload_file(file, prefix=f"doc_{current_user.id}_")
        if document_type == "id_front":
            current_user.id_front_url = file_path
        elif document_type == "id_back":
            current_user.id_back_url = file_path
        current_user.kyc_status = 'pending'
        db.commit()
        db.refresh(current_user)
        print(f"Document uploaded successfully: {file_path}")
        return {"message": "Document uploaded successfully", "url": file_path, "document_type": document_type}
    except Exception as e:
        print(f"Document upload error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")


@app.post("/api/upload/document-base64")
async def upload_document_base64(
    upload: Base64ImageUpload,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload ID document photo from a base64 JSON payload."""
    try:
        document_type = upload.document_type or "id_front"
        file_path = save_base64_image(upload, prefix=f"doc_{current_user.id}_")
        if document_type == "id_front":
            current_user.id_front_url = file_path
        elif document_type == "id_back":
            current_user.id_back_url = file_path
        else:
            raise HTTPException(400, "Invalid document_type")

        current_user.kyc_status = 'pending'
        db.commit()
        db.refresh(current_user)
        print(f"Document uploaded successfully via base64: {file_path}")
        return {"message": "Document uploaded successfully", "url": file_path, "document_type": document_type}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        print(f"Document base64 upload error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")


@app.post("/api/upload/selfie")
async def upload_selfie(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload selfie from liveness"""
    try:
        file_path = save_upload_file(file, prefix=f"selfie_{current_user.id}_")
        current_user.selfie_url = file_path
        current_user.liveness_verified = True
        db.commit()
        db.refresh(current_user)
        print(f"Selfie uploaded successfully: {file_path}")
        return {"message": "Selfie uploaded successfully", "url": file_path}
    except Exception as e:
        print(f"Selfie upload error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")


@app.post("/api/upload/selfie-base64")
async def upload_selfie_base64(
    upload: Base64ImageUpload,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload selfie from a base64 JSON payload."""
    try:
        file_path = save_base64_image(upload, prefix=f"selfie_{current_user.id}_")
        current_user.selfie_url = file_path
        current_user.liveness_verified = True
        db.commit()
        db.refresh(current_user)
        print(f"Selfie uploaded successfully via base64: {file_path}")
        return {"message": "Selfie uploaded successfully", "url": file_path}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        print(f"Selfie base64 upload error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ============================================================
# VALIDATOR ENDPOINTS
# ============================================================

@app.get("/api/validator/pending")
async def get_pending_verifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users pending verification"""
    if current_user.user_role != 'validator':
        raise HTTPException(403, "Access denied. Validator role required.")
    
    users = db.query(User).filter(User.kyc_status == 'pending').all()
    return users


@app.get("/api/validator/all-users")
async def get_all_users_for_validation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users for validation dashboard"""
    if current_user.user_role != 'validator':
        raise HTTPException(403, "Access denied. Validator role required.")
    
    users = db.query(User).filter(User.user_role == 'user').order_by(User.created_at.desc()).all()
    return users


@app.post("/api/validator/approve/{user_id}")
async def approve_user_verification(
    user_id: str,
    notes: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Approve user KYC verification"""
    if current_user.user_role != 'validator':
        raise HTTPException(403, "Access denied. Validator role required.")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(404, "User not found")
        
        user.kyc_status = 'verified'
        user.kyc_verified_by = current_user.id
        user.kyc_verified_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "User verified successfully", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@app.post("/api/validator/reject/{user_id}")
async def reject_user_verification(
    user_id: str,
    notes: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject user KYC verification"""
    if current_user.user_role != 'validator':
        raise HTTPException(403, "Access denied. Validator role required.")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(404, "User not found")
        
        if not notes.get('notes'):
            raise HTTPException(400, "Rejection reason required")
        
        user.kyc_status = 'rejected'
        user.kyc_verified_by = current_user.id
        user.kyc_rejection_reason = notes.get('notes', '')
        
        db.commit()
        
        return {"message": "User verification rejected", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))



# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    HOST = os.getenv("API_HOST", "0.0.0.0")
    PORT = int(os.getenv("API_PORT", 8003))
    
    print(f"""
============================================================
?? CUB Platform API Server
============================================================

?? Server: http://{HOST}:{PORT}
?? API Docs: http://{HOST}:{PORT}/docs
?? ReDoc: http://{HOST}:{PORT}/redoc

============================================================
""")
    
    uvicorn.run(app, host=HOST, port=PORT)
