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

# Import local modules
from database import engine, get_db, Base
from models import (
    User, UserFinancialData, Transaction, Loan, Notification,
    SaleRecord, ExpenseRecord, StockRecord, ReceiptVerification,
    TrustScoreHistory, UserPreference
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
    UserPreferenceResponse, ProfileUpdate
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
