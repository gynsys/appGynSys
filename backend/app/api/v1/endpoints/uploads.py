"""
File upload endpoints for doctor logos and photos.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Annotated
import os
import shutil
from pathlib import Path
from datetime import datetime

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.api.v1.endpoints.auth import get_current_user
from app.core.config import settings

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
LOGO_DIR = UPLOAD_DIR / "logos"
PHOTO_DIR = UPLOAD_DIR / "photos"
GALLERY_DIR = UPLOAD_DIR / "gallery"
LOGO_DIR.mkdir(exist_ok=True)
PHOTO_DIR.mkdir(exist_ok=True)
GALLERY_DIR.mkdir(exist_ok=True)


ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]


def validate_image(file: UploadFile) -> bool:
    """Validate that the uploaded file is an image."""
    return file.content_type in ALLOWED_IMAGE_TYPES


def save_uploaded_file(file: UploadFile, directory: Path, doctor_id: int, file_type: str) -> str:
    """
    Save uploaded file and return the relative URL.
    
    Args:
        file: Uploaded file
        directory: Directory to save the file
        doctor_id: ID of the doctor
        file_type: Type of file (logo or photo)
        
    Returns:
        Relative URL path to the saved file
    """
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = Path(file.filename).suffix
    filename = f"{doctor_id}_{file_type}_{timestamp}{file_extension}"
    file_path = directory / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return relative URL (will be served statically)
    return f"/uploads/{file_type}s/{filename}"


@router.post("/logo", status_code=status.HTTP_200_OK)
async def upload_logo(
    current_user: Annotated[Doctor, Depends(get_current_user)],
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload doctor logo.
    """
    if not validate_image(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Save file
    logo_url = save_uploaded_file(file, LOGO_DIR, current_user.id, "logo")
    
    # Update doctor record
    current_user.logo_url = logo_url
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url
    }


@router.post("/photo", status_code=status.HTTP_200_OK)
async def upload_photo(
    current_user: Annotated[Doctor, Depends(get_current_user)],
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload doctor profile photo.
    """
    if not validate_image(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Save file
    photo_url = save_uploaded_file(file, PHOTO_DIR, current_user.id, "photo")
    
    # Update doctor record
    current_user.photo_url = photo_url
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Photo uploaded successfully",
        "photo_url": photo_url
    }

