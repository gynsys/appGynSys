import sys
import os
import json
import io
from datetime import datetime

# Set stdout to utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost

# Custom encoder for datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def export_data():
    db = SessionLocal()
    try:
        # We know the "good" posts are owned by ID 4 in the local DB
        target_doctor_id = 4 
        print(f"Exporting posts from Local DB for Doctor ID {target_doctor_id}...")
        
        posts = db.query(BlogPost).filter(BlogPost.doctor_id == target_doctor_id).all()
        print(f"Found {len(posts)} posts.")
        
        export_list = []
        for p in posts:
            post_data = {
                "title": p.title,
                "slug": p.slug,
                "content": p.content,
                "summary": p.summary,
                "cover_image": p.cover_image,
                "is_published": p.is_published,
                "published_at": p.published_at,
                "is_in_menu": p.is_in_menu,
                "menu_weight": p.menu_weight,
                "menu_icon": p.menu_icon,
                # SEO CONFIG
                "seo_config": None
            }
            
            if p.seo_config:
                post_data["seo_config"] = {
                    "meta_title": p.seo_config.meta_title,
                    "meta_description": p.seo_config.meta_description,
                    "focus_keyword": p.seo_config.focus_keyword,
                    "canonical_url": p.seo_config.canonical_url,
                    "schema_type": p.seo_config.schema_type,
                    "robots_index": p.seo_config.robots_index,
                    "robots_follow": p.seo_config.robots_follow,
                    "social_title": p.seo_config.social_title,
                    "social_description": p.seo_config.social_description,
                    "social_image": p.seo_config.social_image,
                    "seo_score": p.seo_config.seo_score
                }
            
            export_list.append(post_data)
            
        # Save to file
        filename = "posts_backup.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(export_list, f, indent=2, cls=DateTimeEncoder)
            
        print(f"Successfully exported {len(export_list)} posts to {filename}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    export_data()
