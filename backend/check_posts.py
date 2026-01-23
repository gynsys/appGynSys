import sys
import os

# Add current directory to path so we can import 'app'
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost

def check():
    db = SessionLocal()
    try:
        print("Connecting to DB...")
        posts = db.query(BlogPost).all()
        print(f"Total Posts found: {len(posts)}")
        
        for post in posts:
            print(f"ID: {post.id} | Title: {post.title} | Published: {post.is_published}")
            if post.seo_config:
                print(f"  - SEO Score: {post.seo_config.seo_score}")
            else:
                print(f"  - No SEO Config")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
