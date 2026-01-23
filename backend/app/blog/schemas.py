from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class BlogPostBase(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None
    
    # Mega Menu Fields
    is_in_menu: Optional[bool] = False
    menu_weight: Optional[int] = 0
    menu_icon: Optional[str] = None

class BlogPostCreate(BlogPostBase):
    seo_config: Optional['BlogPostSEOCreate'] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None
    
    # Mega Menu Fields
    is_in_menu: Optional[bool] = None
    menu_weight: Optional[int] = None
    menu_icon: Optional[str] = None
    
    seo_config: Optional['BlogPostSEOUpdate'] = None

class BlogPostResponse(BlogPostBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    doctor_id: int
    is_service_content: bool = False
    
    seo_config: Optional['BlogPostSEOResponse'] = None

    class Config:
        from_attributes = True

# Forward references updates


class MegaMenuItem(BaseModel):
    title: str
    slug: str
    menu_weight: int
    menu_icon: Optional[str] = None
    
    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    author_name: str
    content: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# SEO Schemas
class BlogPostSEOBase(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    canonical_url: Optional[str] = None
    schema_type: Optional[str] = "Article"
    robots_index: Optional[bool] = True
    robots_follow: Optional[bool] = True
    social_title: Optional[str] = None
    social_description: Optional[str] = None
    social_image: Optional[str] = None
    seo_score: Optional[int] = 0

class BlogPostSEOCreate(BlogPostSEOBase):
    pass

class BlogPostSEOUpdate(BlogPostSEOBase):
    pass

class BlogPostSEOResponse(BlogPostSEOBase):
    id: int
    post_id: int
    last_validation: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Validating models after all definitions are complete
BlogPostCreate.model_rebuild()
BlogPostUpdate.model_rebuild()
BlogPostResponse.model_rebuild()
