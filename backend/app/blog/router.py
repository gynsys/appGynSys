from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.service import Service
from app.blog import crud, schemas
from app.blog.models import BlogPost
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/menu/mega/{doctor_slug}", response_model=List[schemas.MegaMenuItem])
def get_mega_menu(
    doctor_slug: str,
    db: Session = Depends(get_db)
):
    """
    Get lightweight menu items for the mega menu.
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    menu_items = db.query(BlogPost).filter(
        BlogPost.doctor_id == doctor.id,
        BlogPost.is_published == True,
        BlogPost.is_in_menu == True
    ).order_by(BlogPost.menu_weight.desc()).all()
    
    return menu_items

@router.get("/public/{doctor_slug}", response_model=List[schemas.BlogPostResponse])
def read_doctor_posts(
    doctor_slug: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get published blog posts for a specific doctor (public).
    """
    doctor = db.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    posts = crud.get_published_posts_by_doctor(db, doctor_id=doctor.id, skip=skip, limit=limit)
    
    # Get all service blog slugs for this doctor
    service_slugs = [
        slug for (slug,) in db.query(Service.blog_slug)
        .filter(Service.doctor_id == doctor.id, Service.blog_slug.isnot(None))
        .all()
    ]
    
    # Mark posts that are service content
    for post in posts:
        if post.slug in service_slugs:
            post.is_service_content = True
        else:
            post.is_service_content = False
            
    return posts

@router.get("/public/post/{slug}", response_model=schemas.BlogPostResponse)
def read_post_public(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific blog post by slug (public).
    """
    post = crud.get_post_by_slug(db, slug=slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not post.is_published:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check if this post is content for a service
    service_link = db.query(Service).filter(Service.blog_slug == post.slug).first()
    if service_link:
        post.is_service_content = True
    else:
        post.is_service_content = False
        
    return post

@router.get("/my-posts", response_model=List[schemas.BlogPostResponse])
def read_my_posts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get all blog posts for the current doctor (CMS).
    """
    posts = crud.get_posts_by_doctor(db, doctor_id=current_user.id, skip=skip, limit=limit)
    return posts

@router.post("/", response_model=schemas.BlogPostResponse)
def create_post(
    post: schemas.BlogPostCreate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Create a new blog post.
    """
    return crud.create_post(db=db, post=post, doctor_id=current_user.id)

@router.get("/{post_id}", response_model=schemas.BlogPostResponse)
def read_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get a specific blog post by ID (CMS).
    """
    post = crud.get_post(db, post_id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this post")
    return post

@router.put("/{post_id}", response_model=schemas.BlogPostResponse)
def update_post(
    post_id: int,
    post: schemas.BlogPostUpdate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Update a blog post.
    """
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    return crud.update_post(db=db, post_id=post_id, post=post)

@router.get("/comments/{post_slug}", response_model=List[schemas.CommentResponse])
def read_comments(
    post_slug: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get comments for a specific blog post (public).
    """
    post = crud.get_post_by_slug(db, slug=post_slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments = crud.get_comments_by_post(db, post_id=post.id, skip=skip, limit=limit)
    return comments

@router.post("/comments/{post_slug}", response_model=schemas.CommentResponse)
def create_comment(
    post_slug: str,
    comment: schemas.CommentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new comment for a blog post (public).
    """
    post = crud.get_post_by_slug(db, slug=post_slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Rate limiting
    client_ip = request.client.host
    if crud.check_rate_limit(db, ip_address=client_ip, post_id=post.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Estás comentando muy rápido. Por favor espera unos minutos."
        )
        
    return crud.create_comment(db=db, comment=comment, post_id=post.id, ip_address=client_ip)

@router.delete("/{post_id}", response_model=schemas.BlogPostResponse)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Delete a blog post.
    """
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    return crud.delete_post(db=db, post_id=post_id)
