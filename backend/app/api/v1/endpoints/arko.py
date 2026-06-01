from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db_session
from app.db.models.arko import ArkoPost, ArkoProject
# from app.api.deps import get_current_active_superuser # Asumiendo que existe un dep de superuser, o usamos el de usuario activo
from app.api.api_v1.deps import get_current_active_user

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

# --- Endpoints Privados (Para el Dashboard GynSys) ---

@router.get("/admin/posts", response_model=List[ArkoPostResponse])
def get_admin_posts(
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_active_user)
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
    current_user = Depends(get_current_active_user)
):
    try:
        with get_db_session() as db:
            existing = db.query(ArkoPost).filter(ArkoPost.slug == post_in.slug).first()
            if existing:
                raise HTTPException(status_code=400, detail="Slug already exists")
            
            post = ArkoPost(
                **post_in.dict(),
                author=post_in.author or current_user.full_name
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
    current_user = Depends(get_current_active_user)
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
    current_user = Depends(get_current_active_user)
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
