import sys
import os
import io

# Set stdout to utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost
from app.db.models.doctor import Doctor

def reassign():
    db = SessionLocal()
    target_email = "milanopabloe@gmail.com"
    
    try:
        print(f"Looking for doctor: {target_email}")
        target_doc = db.query(Doctor).filter(Doctor.email == target_email).first()
        
        if not target_doc:
            print("ERROR: Target doctor not found!")
            return

        print(f"Found Doctor: {target_doc.nombre_completo} (ID: {target_doc.id})")
        
        print("Fetching all blog posts...")
        posts = db.query(BlogPost).all()
        print(f"Total posts found: {len(posts)}")
        
        count = 0
        for post in posts:
            if post.doctor_id != target_doc.id:
                print(f"Reassigning post '{post.title}' (was ID {post.doctor_id}) -> to ID {target_doc.id}")
                post.doctor_id = target_doc.id
                count += 1
            else:
                 print(f"Post '{post.title}' is already owned by ID {target_doc.id}")
        
        if count > 0:
            db.commit()
            print(f"Successfully reassigned {count} posts.")
        else:
            print("All posts are already owned by this user.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reassign()
