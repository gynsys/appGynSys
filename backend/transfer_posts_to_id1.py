import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost, BlogPostSEO

def transfer():
    db = SessionLocal()
    try:
        # We want to move posts to ID 1 (Active User)
        target_id = 1
        print(f"Transferring posts to Doctor ID: {target_id}...")
        
        # Find posts that belong to ID 4 (Old User)
        # Or generally, find ALL posts and move them to ID 1 if that's what the user wants.
        # But let's be safe and target ID 4 specifically first, or all.
        # User said "estas entradas estaban perdidas... forcemos...".
        # Let's move ALL posts to ID 1.
        
        posts = db.query(BlogPost).all()
        count = 0
        for post in posts:
            if post.doctor_id != target_id:
                print(f"Moving '{post.title}' (ID: {post.id}) from Doctor {post.doctor_id} -> {target_id}")
                post.doctor_id = target_id
                count += 1
        
        if count > 0:
            db.commit()
            print(f"Successfully transferred {count} posts to Doctor ID {target_id}.")
        else:
            print("No posts needed transferring.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    transfer()
