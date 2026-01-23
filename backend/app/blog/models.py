from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    
    # Mega Menu Fields
    is_in_menu = Column(Boolean, default=False, index=True)
    menu_weight = Column(Integer, default=0)
    menu_icon = Column(String, nullable=True)
    
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    doctor = relationship("Doctor", back_populates="blog_posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    seo_config = relationship("BlogPostSEO", uselist=False, back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "blog_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("blog_posts.id"), nullable=False)
    author_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    
    post = relationship("BlogPost", back_populates="comments")


class BlogPostSEO(Base):
    __tablename__ = "blog_posts_seo"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("blog_posts.id"), unique=True, nullable=False)
    
    meta_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    focus_keyword = Column(String, nullable=True)
    canonical_url = Column(String, nullable=True)
    schema_type = Column(String, default="Article")
    
    robots_index = Column(Boolean, default=True)
    robots_follow = Column(Boolean, default=True)
    
    social_title = Column(String, nullable=True)
    social_description = Column(String, nullable=True)
    social_image = Column(String, nullable=True)
    
    seo_score = Column(Integer, default=0)
    last_validation = Column(DateTime(timezone=True), nullable=True)
    
    post = relationship("BlogPost", back_populates="seo_config")

