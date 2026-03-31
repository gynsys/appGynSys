"""
Diffusion Campaigns endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTask
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.campaign import DiffusionCampaign
from app.db.models.recommendation import Recommendation
from app.blog.models import BlogPost
from app.schemas.campaign import (
    DiffusionCampaignCreate, 
    DiffusionCampaignResponse, 
    DiffusionSource
)
from app.api.v1.endpoints.auth import get_current_user
# We will import the task once created
# from app.tasks.campaigns import process_diffusion_campaign

router = APIRouter()

@router.get("/sources", response_model=List[DiffusionSource])
async def get_campaign_sources(
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get available blog posts and recommendations for the current doctor.
    """
    sources = []
    
    # 1. Fetch Blog Posts
    posts = db.query(BlogPost).filter(
        BlogPost.doctor_id == current_user.id,
        BlogPost.is_published == True
    ).order_by(BlogPost.created_at.desc()).all()
    
    for post in posts:
        sources.append(DiffusionSource(
            id=post.id,
            title=post.title,
            type="blog",
            summary=post.summary,
            cover_image=post.cover_image,
            url=f"/blog/{post.slug}"
        ))
        
    # 2. Fetch Recommendations
    recoms = db.query(Recommendation).filter(
        Recommendation.tenant_id == current_user.id,
        Recommendation.is_active == True
    ).all()
    
    for recom in recoms:
        sources.append(DiffusionSource(
            id=recom.id,
            title=recom.title,
            type="recommendation",
            summary=recom.description[:150] if recom.description else None,
            cover_image=recom.image_url,
            url=recom.action_url
        ))
        
    return sources

@router.post("/", response_model=DiffusionCampaignResponse)
async def create_campaign(
    campaign_in: DiffusionCampaignCreate,
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Create a new campaign and trigger sending.
    """
    campaign = DiffusionCampaign(
        **campaign_in.model_dump(),
        tenant_id=current_user.id,
        status="sending"
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # Trigger Celery Task (To be implemented)
    from app.tasks.campaigns import process_diffusion_campaign
    process_diffusion_campaign.delay(campaign.id)
    
    return campaign

@router.get("/", response_model=List[DiffusionCampaignResponse])
async def list_campaigns(
    db: Session = Depends(get_db),
    current_user: Doctor = Depends(get_current_user)
):
    """
    Get campaign history for the current doctor.
    """
    return db.query(DiffusionCampaign).filter(
        DiffusionCampaign.tenant_id == current_user.id
    ).order_by(DiffusionCampaign.created_at.desc()).all()
