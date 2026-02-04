import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent dir to path to find app modules if needed, though we use raw SQL here for simplicity
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Database URL from env or default to production
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ih3rj0C3d8h_7zneJdZhmJ92YQM0OnldJPDvvxZYFd4@db:5432/gynsys")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_text(text_str):
    if not text_str:
        return text_str
    
    # List of known common mojibake characters to check for presence
    # ├ = \u251c, │ = \u2502, ┬ = \u252c, ┐ = \u2510, ® = \u00ae, ║ = \u2551, ▒ = \u2592
    triggers = ['\u251c', '\u2502', '\u252c', '\u2510', '\u2551', '\u2592', '├', '│', '┬', '┐']
    
    if not any(t in text_str for t in triggers):
        return text_str

    try:
        # The core logic: encode to CP437, then decode as UTF-8
        # This reverses the "UTF-8 read as CP437" corruption
        fixed = text_str.encode('cp437').decode('utf-8')
        return fixed
    except Exception as e:
        # If conversion fails (e.g. chars not in CP437), return original
        # print(f"Skipping (err): {e}") 
        return text_str

def run_fix():
    session = SessionLocal()
    try:
        print("Starting encoding fix...")
        
        # 1. DOCTORS
        print("Fixing Doctors...")
        doctors = session.execute(text("SELECT id, biografia, especialidad, nombre_completo FROM doctors")).fetchall()
        for doc in doctors:
            updates = {}
            
            new_bio = fix_text(doc.biografia)
            if new_bio != doc.biografia:
                updates['biografia'] = new_bio
                
            new_spec = fix_text(doc.especialidad)
            if new_spec != doc.especialidad:
                updates['especialidad'] = new_spec
                
            new_name = fix_text(doc.nombre_completo)
            if new_name != doc.nombre_completo:
                updates['nombre_completo'] = new_name
                
            if updates:
                print(f"  Updating Doctor {doc.id}...")
                # Dynamically build update query
                set_clauses = ", ".join([f"{k} = :val_{k}" for k in updates.keys()])
                params = {f"val_{k}": v for k, v in updates.items()}
                params['id'] = doc.id
                session.execute(text(f"UPDATE doctors SET {set_clauses} WHERE id = :id"), params)

        # 2. BLOG POSTS
        print("Fixing Blog Posts...")
        posts = session.execute(text("SELECT id, title, content FROM blog_posts")).fetchall()
        count = 0
        for post in posts:
            updates = {}
            new_title = fix_text(post.title)
            if new_title != post.title:
                updates['title'] = new_title
                
            new_content = fix_text(post.content)
            if new_content != post.content:
                updates['content'] = new_content
            
            if updates:
                count += 1
                set_clauses = ", ".join([f"{k} = :val_{k}" for k in updates.keys()])
                params = {f"val_{k}": v for k, v in updates.items()}
                params['id'] = post.id
                session.execute(text(f"UPDATE blog_posts SET {set_clauses} WHERE id = :id"), params)
        print(f"  Fixed {count} posts.")

        # 3. SERVICES
        print("Fixing Services...")
        services = session.execute(text("SELECT id, title, description FROM services")).fetchall()
        count = 0
        for svc in services:
            updates = {}
            new_title = fix_text(svc.title)
            if new_title != svc.title:
                updates['title'] = new_title
                
            new_desc = fix_text(svc.description)
            if new_desc != svc.description:
                updates['description'] = new_desc
            
            if updates:
                count += 1
                set_clauses = ", ".join([f"{k} = :val_{k}" for k in updates.keys()])
                params = {f"val_{k}": v for k, v in updates.items()}
                params['id'] = svc.id
                session.execute(text(f"UPDATE services SET {set_clauses} WHERE id = :id"), params)
        print(f"  Fixed {count} services.")

        session.commit()
        print("✅ SUCCESS: Database encoding fixed.")
        
    except Exception as e:
        session.rollback()
        print(f"❌ ERROR: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run_fix()
