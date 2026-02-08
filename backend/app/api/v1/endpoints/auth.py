"""
Authentication endpoints for login, registration, and OAuth.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated, Union
import re
import unicodedata
import uuid
from pydantic import BaseModel

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorInDB
import secrets
from datetime import datetime, timedelta, timezone
from app.schemas.token import Token, PasswordResetRequest, PasswordResetConfirm
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)
from app.tasks.email_tasks import send_new_tenant_notification, send_reset_password_email
from app.crud.admin import seed_tenant_data

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")



def generate_slug_from_name(name: str) -> str:
    """
    Generate a URL-friendly slug from a name.
    
    Args:
        name: Full name string
        
    Returns:
        URL-friendly slug
    """
    # Normalize unicode characters
    name = unicodedata.normalize('NFKD', name)
    # Convert to lowercase and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


def get_user_by_email(db: Session, email: str) -> Doctor | None:
    """Get a doctor by email."""
    return db.query(Doctor).filter(Doctor.email == email).first()


def get_user_by_slug(db: Session, slug: str) -> Doctor | None:
    """Get a doctor by slug."""
    return db.query(Doctor).filter(Doctor.slug_url == slug).first()


def apply_mariel_template(db: Session, doctor: Doctor):
    """Apply the complete Mariel Herrera template to a new doctor."""
    import os
    import json

    template_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'mariel_herrera_template.json')

    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template = json.load(f)

        # Apply profile configuration
        profile_info = template['profile_info']
        doctor.especialidad = profile_info['especialidad']
        doctor.universidad = profile_info['universidad']
        doctor.biografia = profile_info['biografia']
        doctor.services_section_title = profile_info['services_section_title']
        doctor.contact_email = profile_info['contact_email']

        # Apply theme configuration
        theme_config = template['theme_config']
        doctor.theme_primary_color = theme_config['theme_primary_color']
        doctor.theme_body_bg_color = theme_config['theme_body_bg_color']
        doctor.theme_container_bg_color = theme_config['theme_container_bg_color']
        doctor.card_shadow = theme_config['card_shadow']
        doctor.container_shadow = theme_config['container_shadow']

        # Apply social media
        social_media = template['social_media']
        doctor.social_instagram = social_media['social_instagram']
        doctor.social_tiktok = social_media['social_tiktok']
        # Keep YouTube, X, Facebook empty for new doctors

        # Apply schedule and PDF config
        doctor.schedule = template['schedule']
        doctor.pdf_config = template['pdf_config']

        pass

    except FileNotFoundError:
        pass
        # Fallback to default seeding
        seed_tenant_data(db, doctor)
    except Exception as e:
        pass
        # Fallback to default seeding
        seed_tenant_data(db, doctor)


@router.post("/register", response_model=DoctorInDB, status_code=status.HTTP_201_CREATED)
async def register(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new doctor account.
    
    Creates a new doctor with email/password authentication.
    Generates a unique slug_url from the doctor's name.
    """
    # Check if email already exists
    existing_doctor = get_user_by_email(db, doctor_data.email)
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate slug if not provided
    slug = doctor_data.slug_url or generate_slug_from_name(doctor_data.nombre_completo)
    
    # Check if slug already exists
    existing_slug = get_user_by_slug(db, slug)
    if existing_slug:
        # Append a number if slug exists
        counter = 1
        original_slug = slug
        while get_user_by_slug(db, slug):
            slug = f"{original_slug}-{counter}"
            counter += 1
    
    # Create new doctor
    hashed_password = hash_password(doctor_data.password)
    db_doctor = Doctor(
        email=doctor_data.email,
        password_hash=hashed_password,
        nombre_completo=doctor_data.nombre_completo,
        especialidad=doctor_data.especialidad,
        biografia=doctor_data.biografia,
        slug_url=slug,
        # New onboarding fields
        is_active=False,  # Inactive until approved
        status='pending',
        plan_id=doctor_data.plan_id,
        payment_reference=doctor_data.payment_reference
    )
    
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    # Apply Mariel Herrera template to new doctor
    apply_mariel_template(db, db_doctor)
    
    # Commit template changes
    db.commit()
    db.refresh(db_doctor)
    
    # Send notification to admin
    try:
        send_new_tenant_notification.delay({
            "nombre_completo": db_doctor.nombre_completo,
            "email": db_doctor.email,
            "plan_id": db_doctor.plan_id,
            "payment_reference": db_doctor.payment_reference
        })
    except Exception as e:
        pass
    
    return db_doctor


@router.post("/token", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    Login endpoint that returns a JWT access token.
    
    TEMPORARILY DISABLED PASSWORD VERIFICATION FOR ADMIN TESTING
    """
    # Get user by email
    pass
    doctor = get_user_by_email(db, form_data.username)  # form_data.username is the email
    
    if not doctor:
        pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, doctor.password_hash):
        pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if not doctor.is_active:
        detail_msg = "Account is pending approval" if doctor.status == 'pending' else "Account is inactive"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail_msg
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": doctor.email, "doctor_id": doctor.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/login/google", response_model=Token)
async def login_google(
    login_data: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with Google ID Token (from Frontend).
    Verifies the token and returns a JWT access token.
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests
    from app.core.config import settings
    
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
        
    import requests as py_requests
    try:
        # Verify via ID Token OR fetch via Access Token
        email = None
        name = ""
        
        if len(login_data.token) > 500: # Likely an ID Token (JWT)
            print(f"Verifying Google ID Token...")
            try:
                id_info = id_token.verify_oauth2_token(
                    login_data.token,
                    requests.Request(),
                    settings.GOOGLE_CLIENT_ID
                )
                email = id_info.get("email")
                name = id_info.get("name", "")
            except Exception as e:
                print(f"ID Token Verification Failed: {e}")
                raise ValueError(f"ID Token Verification Failed: {e}")
        else:
            print(f"Fetching Google Profile via Access Token...")
            # If it's short, it's likely an Access Token
            response = py_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {login_data.token}"}
            )
            if response.status_code != 200:
                print(f"Access Token verification failed: {response.text}")
                raise ValueError("Invalid Google Access Token")
            
            user_info = response.json()
            email = user_info.get("email")
            name = user_info.get("name", "")

        if not email:
            raise ValueError("Could not retrieve email from Google")
            
        print(f"Google User Verified: {email} ({name})")
        
        # Check if doctor exists
        doctor = get_user_by_email(db, email)
        
        if not doctor:
            print("User not found, checking whitelist...")
            
            # Validate email is in whitelist
            allowed_emails = settings.oauth_allowed_emails
            allowed_domains = settings.oauth_allowed_domains
            
            email_allowed = False
            
            # Check if email is explicitly whitelisted
            if email in allowed_emails:
                email_allowed = True
                print(f"Email {email} found in whitelist")
            
            # Check if email domain is whitelisted
            if not email_allowed and allowed_domains:
                for domain in allowed_domains:
                    if email.endswith(domain):
                        email_allowed = True
                        print(f"Email {email} matches whitelisted domain {domain}")
                        break
            
            # If no whitelist is configured, deny by default (secure by default)
            if not allowed_emails and not allowed_domains:
                print("WARNING: No OAuth whitelist configured - denying access")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Google OAuth registration is not available. Please contact support or use email/password registration."
                )
            
            if not email_allowed:
                print(f"Email {email} not in whitelist - access denied")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This email is not authorized for Google OAuth login. Please contact support."
                )
            
            print("User not found but whitelisted, registering new...")
            # Create new doctor account (Auto-Registration)
            slug = generate_slug_from_name(name)
            # Ensure slug is unique
            counter = 1
            original_slug = slug
            while get_user_by_slug(db, slug):
                slug = f"{original_slug}-{counter}"
                counter += 1
            
            doctor = Doctor(
                email=email,
                password_hash=None,  # No password for OAuth users
                nombre_completo=name,
                slug_url=slug,
                is_verified=True,  # Google email is verified
                is_active=True,    
                status='approved' 
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)
            
            # Apply Template
            try:
                apply_mariel_template(db, doctor)
                db.commit()
            except Exception as e:
                 print(f"Template Error (Non-fatal): {e}")
            
        else:
            print("User found, updating...")
            # Update existing doctor info if needed
            if not doctor.nombre_completo:
                doctor.nombre_completo = name
                db.commit()
                
        # Check active status (if user existed and was banned/inactive)
        if not doctor.is_active:
             print("User inactive!")
             raise HTTPException(status_code=403, detail="Account is inactive")

        # Create JWT token
        access_token = create_access_token(
            data={"sub": doctor.email, "doctor_id": doctor.id}
        )
        print("Generated JWT Token successfully.")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Invalid token
        print(f"ValueError: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Google Login Critical Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google Login Failed: {str(e)}"
        )



# --- Guest / Patient Authentication ---

class GuestUser(BaseModel):
    id: str
    email: str # specific format: guest_UUID
    role: str = "guest"
    tenant_id: str
    nombre_completo: str

@router.post("/guest-login")
async def guest_login(
    body: dict, # { "doctor_id": str, "name": str }
    db: Session = Depends(get_db)
):
    """
    Generate a guest token for a patient to chat with a specific doctor (tenant).
    
    Auto-creates a chat room between the guest and the doctor if it doesn't exist.
    """
    doctor_id = body.get("doctor_id")
    name = body.get("name", "Paciente")
    
    if not doctor_id:
        raise HTTPException(status_code=400, detail="Doctor ID required")
        
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Generate a random guest ID
    guest_id = str(uuid.uuid4())
    guest_email = f"guest_{guest_id}@gynsys.temp"
    
    # Encode tenant_id in the token so we know which context they belong to
    access_token = create_access_token(
        data={
            "sub": guest_email, 
            "user_id": guest_id, 
            "role": "guest",
            "tenant_id": str(doctor_id), 
            "name": name
        },
        expires_delta=timedelta(days=30) # Long session for returning patients
    )
    
    # Auto-create a chat room between the guest and the doctor
    try:
        from app.chat.models import ChatRoom, ChatParticipant
        from sqlalchemy import text
        
        # Set RLS context for the doctor's tenant
        db.execute(text(f"SET app.current_tenant = '{doctor_id}'"))
        
        # Check if a room already exists for this guest
        # (In case they're logging in again with the same guest_id somehow, or this is a retry)
        # This is a simplified check - in production you might want more sophisticated matching
        existing_room = db.query(ChatRoom)\
            .join(ChatParticipant)\
            .filter(ChatParticipant.user_id == guest_id)\
            .filter(ChatRoom.tenant_id == str(doctor_id))\
            .first()
        
        if not existing_room:
            # Create new room
            new_room = ChatRoom(
                tenant_id=str(doctor_id),
                type="direct",
                meta_data={"guest_name": name, "doctor_id": str(doctor_id)}
            )
            db.add(new_room)
            db.flush()  # Get the room ID
            
            # Add guest as participant
            guest_participant = ChatParticipant(
                room_id=new_room.id,
                user_id=guest_id,
                tenant_id=str(doctor_id),
                role="member"
            )
            db.add(guest_participant)
            
            # Add doctor as participant
            doctor_participant = ChatParticipant(
                room_id=new_room.id,
                user_id=str(doctor_id),
                tenant_id=str(doctor_id),
                role="owner"
            )
            db.add(doctor_participant)
            
            db.commit()
    except Exception as e:
        # Log the error but don't fail the login
        # The user can still create a room manually or via frontend
        print(f"Warning: Failed to auto-create chat room for guest {guest_id}: {e}")
        db.rollback()
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": guest_id, "name": name}}


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> Doctor | GuestUser:
    """
    Dependency to get the current authenticated user (Doctor or Guest) from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_access_token(token)
        if payload is None:
            raise credentials_exception
            
        role = payload.get("role")
        
        if role == "guest":
            # Return a Guest User object (not from DB, just from Token)
            return GuestUser(
                id=payload.get("user_id"),
                email=payload.get("sub"),
                role="guest",
                tenant_id=payload.get("tenant_id"),
                nombre_completo=payload.get("name")
            )
            
        # Regular Doctor/Admin Logic
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        doctor = get_user_by_email(db, email)
        if doctor is None:
            raise credentials_exception
        
        return doctor
        
    except Exception:
        raise credentials_exception


@router.get("/me", response_model=DoctorInDB)
async def read_users_me(
    current_user: Annotated[Doctor, Depends(get_current_user)]
):
    """
    Get current user information.
    """
    return current_user


async def get_current_admin_user(
    current_user: Annotated[Doctor, Depends(get_current_user)]
) -> Doctor:
    """
    Dependency to get the current authenticated admin user.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


@router.post("/password-recovery")
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset token.
    """
    doctor = get_user_by_email(db, request.email)
    if not doctor:
        # Return 200 even if email not found to prevent user enumeration
        return {"message": "If the email is registered, you will receive a reset link"}
    
    # Generate token
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    doctor.reset_password_token = token
    doctor.reset_password_expires = expires
    db.commit()
    
    # Send email
    send_reset_password_email.delay(doctor.email, token)
    
    return {"message": "If the email is registered, you will receive a reset link"}


@router.post("/reset-password")
async def reset_password(
    confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using token.
    """
    doctor = db.query(Doctor).filter(Doctor.reset_password_token == confirm.token).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    if not doctor.reset_password_expires or doctor.reset_password_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expired"
        )
        
    # Update password
    doctor.password_hash = hash_password(confirm.new_password)
    doctor.reset_password_token = None
    doctor.reset_password_expires = None
    db.commit()
    
    return {"message": "Password updated successfully"}

