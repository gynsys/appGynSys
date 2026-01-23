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
from app.blog.models import BlogPost, BlogPostSEO
from app.blog.crud import slugify

def import_data():
    db = SessionLocal()
    filename = "posts_backup.json"
    
    # Target User ID in Docker is 1 (milanopabloe@gmail.com)
    target_doctor_id = 1
    
    try:
        if not os.path.exists(filename):
            print(f"File {filename} not found!")
            return

        with open(filename, "r", encoding="utf-8") as f:
            posts_data = json.load(f)
            
        print(f"Loaded {len(posts_data)} posts from backup.")
        print(f"Targeting Doctor ID: {target_doctor_id}")
        
        imported_count = 0
        skipped_count = 0
        
        for p_data in posts_data:
            # Check if exists by slug
            slug = p_data['slug']
            existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()
            
            if existing:
                print(f"Skipping '{p_data['title']}' (Slug: {slug}) - Already exists.")
                skipped_count += 1
                continue
                
            # Create new post
            new_post = BlogPost(
                title=p_data['title'],
                slug=slug,
                content=p_data['content'],
                summary=p_data['summary'],
                cover_image=p_data['cover_image'],
                is_published=p_data['is_published'],
                published_at=datetime.fromisoformat(p_data['published_at']) if p_data['published_at'] else None,
                is_in_menu=p_data.get('is_in_menu', False),
                menu_weight=p_data.get('menu_weight', 0),
                menu_icon=p_data.get('menu_icon'),
                doctor_id=target_doctor_id # Force to target user
            )
            
            db.add(new_post)
            db.commit()
            db.refresh(new_post)
            
            # Handle SEO
            seo_data = p_data.get('seo_config')
            if seo_data:
                new_seo = BlogPostSEO(
                    post_id=new_post.id,
                    meta_title=seo_data['meta_title'],
                    meta_description=seo_data['meta_description'],
                    focus_keyword=seo_data['focus_keyword'],
                    canonical_url=seo_data['canonical_url'],
                    schema_type=seo_data['schema_type'],
                    robots_index=seo_data.get('robots_index', True),
                    robots_follow=seo_data.get('robots_follow', True),
                    social_title=seo_data['social_title'],
                    social_description=seo_data['social_description'],
                    social_image=seo_data['social_image'],
                    seo_score=seo_data.get('seo_score', 0),
                    last_validation=datetime.utcnow()
                )
                db.add(new_seo)
                db.commit()
            
            print(f"Imported: '{new_post.title}' (ID: {new_post.id})")
            imported_count += 1
            
        print(f"\n--- Import Summary ---")
        print(f"Total: {len(posts_data)}")
        print(f"Imported: {imported_count}")
        print(f"Skipped: {skipped_count}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
