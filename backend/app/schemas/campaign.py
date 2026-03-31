"""
Pydantic schemas for Diffusion Campaigns.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

class DiffusionCampaignBase(BaseModel):
    title: str
    subject: str
    content_html: str
    content_text: Optional[str] = None
    source_type: str = "custom" # custom, blog, recommendation
    source_id: Optional[int] = None
    target_type: str = "all" # all, app_users, patients

class DiffusionCampaignCreate(DiffusionCampaignBase):
    pass

class DiffusionCampaignUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content_html: Optional[str] = None
    status: Optional[str] = None # draft, sending, sent, failed

class DiffusionCampaignResponse(DiffusionCampaignBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    tenant_id: int
    status: str
    stats: Dict[str, Any]
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class DiffusionSource(BaseModel):
    id: int
    title: str
    type: str # blog, recommendation
    summary: Optional[str] = None
    image_url: Optional[str] = None
    url: Optional[str] = None
