from typing import List, Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile, Form
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
async def generate_blog_ai(
    topic: Optional[str] = Form(None),
    tone: str = Form("Profesional"),
    target_audience: str = Form("Pacientes generales"),
    max_words: int = Form(500),
    source_link: Optional[str] = Form(None),
    pdf_file: Optional[UploadFile] = File(None),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Genera contenido para el blog usando IA. Solo accesible para doctores.
    Soporta opcionalmente un archivo PDF adjunto.
    """
    extracted_text = None
    if pdf_file:
        if not pdf_file.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")
        
        try:
            import fitz
            content = await pdf_file.read()
            with fitz.open(stream=content, filetype="pdf") as doc:
                extracted_text = ""
                for i in range(min(5, len(doc))): # Leer hasta 5 páginas
                    extracted_text += doc[i].get_text()
                extracted_text = extracted_text[:8000] # Limitar a 8k caracteres
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error procesando PDF subido: {e}")
            # No fallar aquí, intentar seguir sin el texto si es posible o avisar
            extracted_text = f"[Error leyendo PDF adjunto: {str(e)}]"

    try:
        from app.services import ai_service
        result = ai_service.generate_blog_content(
            topic=topic,
            tone=tone,
            target_audience=target_audience,
            max_words=max_words,
            source_link=source_link,
            source_text=extracted_text # Pasar el texto extraído directamente
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
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

@router.post("/generate-social-from-content", response_model=schemas.SocialContentResponse)
def generate_social_from_content_ai(
    request_data: schemas.SocialContentFromContentRequest,
    current_user: Doctor = Depends(get_current_user)
):
    """
    Generates social media content (Video/Carousel) from arbitrary text content.
    Useful for converting saved carousels to videos.
    """
    try:
        from app.services import social_service
        result = social_service.generate_social_content(
            post_title=request_data.title,
            post_content=request_data.content,
            generation_type=request_data.gen_type
        )
        
        if isinstance(result, dict):
            result['type'] = request_data.gen_type
            
        return schemas.SocialContentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en generación social desde contenido: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al generar contenido social.")

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

@router.get("/social-audios", response_model=List[schemas.SocialAudioResponse])
def get_my_social_audios(
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """List all uploaded social audios for the current doctor."""
    return crud.get_social_audios_by_doctor(db=db, doctor_id=current_user.id)

@router.delete("/social-audios/{audio_id}", response_model=schemas.SocialAudioResponse)
def delete_social_audio(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """Delete an uploaded social audio."""
    result = crud.delete_social_audio(db=db, audio_id=audio_id, doctor_id=current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Audio not found")
    return result

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
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"Attempting to delete carousel {carousel_id} for doctor {current_user.id}")
        result = crud.delete_carousel(db=db, carousel_id=carousel_id, doctor_id=current_user.id)
        if not result:
            logger.warning(f"Carousel {carousel_id} not found for doctor {current_user.id}")
            raise HTTPException(status_code=404, detail="Carousel not found")
        logger.info(f"Carousel {carousel_id} deleted successfully")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting carousel {carousel_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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


