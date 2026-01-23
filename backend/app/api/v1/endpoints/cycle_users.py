"""
API endpoints for cycle predictor users (patients).
Handles registration and authentication for end-users of the cycle predictor.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
from app.db.base import get_db
from app.db.models.cycle_user import CycleUser
from app.db.models.doctor import Doctor
from app.schemas.cycle_user import CycleUserCreate, CycleUserResponse
from app.schemas.token import Token, PasswordResetRequest, PasswordResetConfirm
from app.core.security import hash_password, create_access_token, verify_access_token, verify_password
from app.tasks.email_tasks import send_reset_password_email
import secrets
from datetime import datetime, timedelta, timezone

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")


def get_current_cycle_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> CycleUser:
    """Dependency to get current authenticated cycle user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_access_token(token)
    if payload is None:
        print("DEBUG: Payload is None")
        raise credentials_exception
    
    email: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    print(f"DEBUG: Token email={email}, user_type={user_type}")

    if email is None or user_type != "cycle_user":
        print(f"DEBUG: Invalid email or user_type: {user_type}")
        raise credentials_exception
    
    user = db.query(CycleUser).filter(CycleUser.email == email).first()
    if user is None:
        print(f"DEBUG: User not found for email {email}")
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


@router.post("/login", response_model=Token)
async def login_cycle_user(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    Login endpoint for cycle predictor users.
    Returns a JWT access token for authenticated users.
    """
    # Get user by email (form_data.username is the email)
    user = db.query(CycleUser).filter(CycleUser.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "user_type": "cycle_user",
            "doctor_id": user.doctor_id
        }
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


from fastapi import BackgroundTasks

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_cycle_user(
    user_data: CycleUserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new cycle predictor user.
    User must provide a doctor_slug to associate with a specific doctor/tenant.
    """
    print(f"DEBUG: Registering user: {user_data.email}, slug: {user_data.doctor_slug}")
    
    # Find the doctor by slug
    doctor = db.query(Doctor).filter(Doctor.slug_url == user_data.doctor_slug).first()
    if not doctor:
        print(f"DEBUG: Doctor not found for slug: {user_data.doctor_slug}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    print(f"DEBUG: Found doctor: {doctor.id}")
    
    # Check if doctor has cycle_predictor module enabled
    # Note: ensure enabled_module_codes is accessible
    try:
        if 'cycle_predictor' not in doctor.enabled_module_codes:
            print("DEBUG: cycle_predictor module not enabled")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cycle predictor is not available for this doctor"
            )
    except Exception as e:
        print(f"DEBUG: Error accessing module codes: {e}")
        # Proceed/Fail?
        # If attribute error, maybe schema issue.
        pass

    # Check if email already exists
    existing_user = db.query(CycleUser).filter(CycleUser.email == user_data.email).first()
    if existing_user:
        print(f"DEBUG: Email already registered: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    print("DEBUG: Creating user...")
    # Create new cycle user
    hashed_password = hash_password(user_data.password)
    db_user = CycleUser(
        email=user_data.email,
        password_hash=hashed_password,
        nombre_completo=user_data.nombre_completo,
        doctor_id=doctor.id,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "user_id": db_user.id,
            "user_type": "cycle_user",
            "doctor_id": doctor.id
        }
    )
    
    # Send welcome email
    from app.core.email import send_welcome_email
    background_tasks.add_task(send_welcome_email, db_user.email, db_user.nombre_completo)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=CycleUserResponse)
async def get_current_cycle_user_info(
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Get current authenticated cycle user."""
    return current_user


from app.schemas.cycle_user import CycleUserUpdate

@router.put("/me", response_model=CycleUserResponse)
async def update_current_cycle_user(
    update_data: CycleUserUpdate,
    db: Session = Depends(get_db),
    current_user: CycleUser = Depends(get_current_cycle_user)
):
    """Update current authenticated cycle user details."""
    
    if update_data.nombre_completo is not None:
        current_user.nombre_completo = update_data.nombre_completo
    
    # We may want to restrict email updates or handle them carefully
    if update_data.email is not None and update_data.email != current_user.email:
        # Check if new email exists
        exists = db.query(CycleUser).filter(CycleUser.email == update_data.email).first()
        if exists:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = update_data.email
        
    if update_data.cycle_avg_length is not None:
        current_user.cycle_avg_length = update_data.cycle_avg_length
        
    if update_data.period_avg_length is not None:
        current_user.period_avg_length = update_data.period_avg_length
        
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/password-recovery")
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset token for Cycle User.
    """
    user = db.query(CycleUser).filter(CycleUser.email == request.email).first()
    if not user:
        # Return 200 to prevent enumeration
        return {"message": "If the email is registered, you will receive a reset link"}
    
    # Generate token
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user.reset_password_token = token
    user.reset_password_expires = expires
    db.commit()
    
    # Send email
    from app.tasks.email_tasks import send_cycle_user_reset_password_email
    send_cycle_user_reset_password_email.delay(user.email, token)
    
    return {"message": "If the email is registered, you will receive a reset link"}


@router.post("/reset-password")
async def reset_password(
    confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using token for Cycle User.
    """
    user = db.query(CycleUser).filter(CycleUser.reset_password_token == confirm.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    if not user.reset_password_expires or user.reset_password_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expired"
        )
        
    # Update password
    user.password_hash = hash_password(confirm.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    db.commit()
    
    return {"message": "Password updated successfully"}


