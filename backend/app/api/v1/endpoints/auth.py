"""
Authentication endpoints for login, registration, and OAuth.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
import re
import unicodedata

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorInDB
from app.schemas.token import Token
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)

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
        slug_url=slug
    )
    
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    return db_doctor


@router.post("/token", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    Login endpoint that returns a JWT access token.
    
    Uses OAuth2PasswordRequestForm for compatibility with OAuth2 standard.
    """
    # Get user by email
    doctor = get_user_by_email(db, form_data.username)  # form_data.username is the email
    
    if not doctor or not doctor.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, doctor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": doctor.email, "doctor_id": doctor.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/login/google")
async def login_google():
    """
    Initiate Google OAuth login flow.
    Redirects to Google's OAuth consent screen.
    """
    from app.core.config import settings
    
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
    
    # Build Google OAuth URL
    redirect_uri = settings.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/auth/login/google/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    
    # In a real implementation, you would redirect here
    # For now, return the URL for the frontend to handle
    return {"auth_url": google_auth_url}


@router.get("/login/google/callback")
async def login_google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback.
    Exchanges authorization code for user info and creates/updates doctor account.
    """
    from app.core.config import settings
    import httpx
    
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/auth/login/google/callback"
    
    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Get user info from Google
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        user_info = user_info_response.json()
        email = user_info.get("email")
        name = user_info.get("name", "")
        
        # Check if doctor exists
        doctor = get_user_by_email(db, email)
        
        if not doctor:
            # Create new doctor account
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
                is_verified=True  # Google email is verified
            )
            db.add(doctor)
        else:
            # Update existing doctor
            if not doctor.nombre_completo:
                doctor.nombre_completo = name
            doctor.is_verified = True
        
        db.commit()
        db.refresh(doctor)
        
        # Create JWT token
        jwt_token = create_access_token(
            data={"sub": doctor.email, "doctor_id": doctor.id}
        )
        
        return {"access_token": jwt_token, "token_type": "bearer"}


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> Doctor:
    """
    Dependency to get the current authenticated user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    doctor = get_user_by_email(db, email)
    if doctor is None:
        raise credentials_exception
    
    return doctor

