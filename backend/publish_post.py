import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost

def publish_latest_post():
    db = SessionLocal()
    try:
        # Get the latest post
        post = db.query(BlogPost).order_by(BlogPost.created_at.desc()).first()
        if post:
            print(f"Latest post: {post.title}")
            print(f"Current status: {'Published' if post.is_published else 'Draft'}")
            
            if not post.is_published:
                post.is_published = True
                db.commit()
                print("Updated to: Published")
            else:
                print("Already published.")
        else:
            print("No posts found.")
            
    finally:
        db.close()

if __name__ == "__main__":
    publish_latest_post()
