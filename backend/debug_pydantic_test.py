import sys
import os
from typing import List

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost
from app.blog.schemas import BlogPostResponse

def debug():
    db = SessionLocal()
    try:
        # Hardcoded ID for 'Dra. Mariel Herrera' based on previous context (ID 4)
        # Or we can query it.
        doctor_id = 4
        print(f"Fetching posts for Doctor ID: {doctor_id}...")
        
        posts = db.query(BlogPost).filter(BlogPost.doctor_id == doctor_id).all()
        print(f"Found {len(posts)} posts.")
        
        for i, post in enumerate(posts):
            print(f"[{i+1}/{len(posts)}] Validating: '{post.title}' (ID: {post.id})")
            try:
                # Force access to relationship to ensure lazy loading doesn't crash here
                seo = post.seo_config 
                if seo:
                     print(f"   - Has SEO: {seo.seo_score}")
                
                # Validate against schema
                validated = BlogPostResponse.model_validate(post)
                # print("   - OK")
            except Exception as e:
                print(f"   !!! FAILED VALIDATION !!!")
                print(e)
                # Continue finding others?
                
        print("\nAll Done.")
            
    except Exception as e:
        print(f"Database/Script Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug()
