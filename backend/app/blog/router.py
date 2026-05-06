from typing import List, Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.service import Service
from app.blog import crud, schemas
from app.blog.models import BlogPost
from app.api.v1.endpoints.auth import get_current_user
from app.services import ai_service

router = APIRouter()

@router.post("/generate", response_model=schemas.AIGenerationResponse)
def generate_blog_ai(
    request_data: schemas.AIGenerationRequest,
    current_user: Doctor = Depends(get_current_user)
):
    """
    Genera contenido para el blog usando IA. Solo accesible para doctores.
    """
    try:
        result = ai_service.generate_blog_content(
            topic=request_data.topic,
            tone=request_data.tone,
            target_audience=request_data.target_audience,
            max_words=request_data.max_words
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error en generación de IA: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al generar contenido con IA.")

@router.post("/{post_id}/generate-social", response_model=schemas.SocialContentResponse)
def generate_social_ai(
    post_id: int,
    gen_type: str, # 'reel' or 'carousel'
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Generates social media content (Reel/Carousel) for a specific blog post.
    """
    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.doctor_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
        
    try:
        from app.services import social_service
        result = social_service.generate_social_content(
            post_title=post.title,
            post_content=post.content,
            generation_type=gen_type
        )
        
        # Inject the type for schema validation
        if isinstance(result, dict):
            result['type'] = gen_type
            
        return schemas.SocialContentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        error_msg = str(e)
        logger.error(f"Error en generación social: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la generación social: {error_msg}"
        )

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
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get all blog posts for the current doctor (CMS).
    """
    posts = crud.get_posts_by_doctor(db, doctor_id=current_user.id, skip=skip, limit=limit)
    return posts

# Social Carousel Endpoints
@router.post("/carousels", response_model=schemas.SocialCarouselResponse)
def create_social_carousel(
    carousel: schemas.SocialCarouselCreate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """Save a new carousel project to the database."""
    return crud.create_carousel(db=db, carousel=carousel, doctor_id=current_user.id)

@router.get("/carousels", response_model=List[schemas.SocialCarouselResponse])
def get_my_carousels(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """List all carousel projects for the current doctor."""
    return crud.get_carousels_by_doctor(db=db, doctor_id=current_user.id, skip=skip, limit=limit)

@router.put("/carousels/{carousel_id}", response_model=schemas.SocialCarouselResponse)
def update_social_carousel(
    carousel_id: int,
    carousel: schemas.SocialCarouselCreate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """Update an existing carousel project."""
    result = crud.update_carousel(db=db, carousel_id=carousel_id, carousel=carousel, doctor_id=current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Carousel not found")
    return result

@router.delete("/carousels/{carousel_id}", response_model=schemas.SocialCarouselResponse)
def delete_social_carousel(
    carousel_id: int,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """Delete a carousel project."""
    result = crud.delete_carousel(db=db, carousel_id=carousel_id, doctor_id=current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Carousel not found")
    return result

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


