from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext

from app.db.session import get_db_session
from app.db.models.arko import ArkoPost, ArkoProject, ArkoAdmin
from app.core.security import create_access_token
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

router = APIRouter()

# --- Pydantic Schemas ---

class ArkoPostBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = "published"
    seo_config: Optional[Any] = None

class ArkoPostCreate(ArkoPostBase):
    pass

class ArkoPostResponse(ArkoPostBase):
    id: int
    published_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Endpoints Públicos (Para la Landing) ---

@router.get("/posts", response_model=List[ArkoPostResponse])
def get_public_posts(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None
):
    try:
        with get_db_session() as db:
            query = db.query(ArkoPost).filter(ArkoPost.status == "published")
            if category:
                query = query.filter(ArkoPost.category == category)
            
            posts = query.order_by(ArkoPost.published_at.desc()).offset(skip).limit(limit).all()
            return posts
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error fetching Arko posts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/posts/{slug}", response_model=ArkoPostResponse)
def get_public_post(slug: str):
    try:
        with get_db_session() as db:
            post = db.query(ArkoPost).filter(ArkoPost.slug == slug, ArkoPost.status == "published").first()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            return post
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error fetching Arko post {slug}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

        raise HTTPException(status_code=500, detail="Internal server error")

# --- Autenticación Arko ---

@router.post("/auth/login")
def login_arko_admin(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with get_db_session() as db:
            user = db.query(ArkoAdmin).filter(ArkoAdmin.email == form_data.username).first()
            if not user or not verify_password(form_data.password, user.hashed_password):
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            if not user.is_active:
                raise HTTPException(status_code=400, detail="Inactive user")
            
            access_token = create_access_token(
                data={"sub": user.email, "type": "arko_admin"}
            )
            return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error in Arko login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# --- Dependencia Arko ---
from fastapi.security import OAuth2PasswordBearer
import jwt

oauth2_scheme_arko = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/arko/auth/login")

def get_current_arko_admin(token: str = Depends(oauth2_scheme_arko)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "arko_admin":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    with get_db_session() as db:
        user = db.query(ArkoAdmin).filter(ArkoAdmin.email == email).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user

# --- Endpoints Privados (Para el Dashboard Arko) ---

@router.get("/admin/posts", response_model=List[ArkoPostResponse])
def get_admin_posts(
    skip: int = 0,
    limit: int = 50,
    current_admin = Depends(get_current_arko_admin)
):
    try:
        with get_db_session() as db:
            posts = db.query(ArkoPost).order_by(ArkoPost.created_at.desc()).offset(skip).limit(limit).all()
            return posts
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error fetching admin Arko posts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/admin/posts", response_model=ArkoPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: ArkoPostCreate,
    current_admin = Depends(get_current_arko_admin)
):
    try:
        with get_db_session() as db:
            existing = db.query(ArkoPost).filter(ArkoPost.slug == post_in.slug).first()
            if existing:
                raise HTTPException(status_code=400, detail="Slug already exists")
            
            post = ArkoPost(
                **post_in.dict(),
                author=post_in.author or current_admin.full_name
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            return post
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error creating Arko post: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/admin/posts/{post_id}", response_model=ArkoPostResponse)
def update_post(
    post_id: int,
    post_in: ArkoPostCreate,
    current_admin = Depends(get_current_arko_admin)
):
    try:
        with get_db_session() as db:
            post = db.query(ArkoPost).filter(ArkoPost.id == post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            
            # Check slug collision
            if post.slug != post_in.slug:
                existing = db.query(ArkoPost).filter(ArkoPost.slug == post_in.slug).first()
                if existing:
                    raise HTTPException(status_code=400, detail="Slug already exists")

            for field, value in post_in.dict(exclude_unset=True).items():
                setattr(post, field, value)
            
            db.commit()
            db.refresh(post)
            return post
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error updating Arko post: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/admin/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_admin = Depends(get_current_arko_admin)
):
    try:
        with get_db_session() as db:
            post = db.query(ArkoPost).filter(ArkoPost.id == post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            
            db.delete(post)
            db.commit()
            return None
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error deleting Arko post: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
