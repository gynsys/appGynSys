import sys
import os
import io

# Set stdout to utf-8 to avoid charmap errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.blog.models import BlogPost
from app.db.models.doctor import Doctor

def audit():
    db = SessionLocal()
    try:
        print("--- Doctors ---")
        doctors = db.query(Doctor).all()
        for doc in doctors:
            try:
                name = doc.nombre_completo
                print(f"ID: {doc.id} | Name: {name} | Slug: {doc.slug_url} | Email: {doc.email}")
            except Exception as e:
                print(f"ID: {doc.id} | [Error printing doctor: {e}]")

        print("\n--- Blog Posts by Doctor ---")
        posts = db.query(BlogPost).all()
        
        # Group manually
        doc_posts = {}
        for post in posts:
            if post.doctor_id not in doc_posts:
                doc_posts[post.doctor_id] = []
            doc_posts[post.doctor_id].append(post)
            
        for doc_id, p_list in doc_posts.items():
            print(f"\nDoctor ID {doc_id} has {len(p_list)} posts:")
            for p in p_list:
                try:
                    title = p.title
                    print(f"  - [{p.id}] {title} (Published: {p.is_published})")
                except Exception as e:
                    print(f"  - [{p.id}] [Error printing title: {e}]")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit()
