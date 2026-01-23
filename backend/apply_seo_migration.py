import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.base import engine, Base
# Import the model so it is registered in Base.metadata
from app.blog.models import BlogPostSEO

def migrate():
    print("Checking for missing tables in PostgreSQL...")
    
    # Check if table exists
    with engine.connect() as connection:
        result = connection.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blog_posts_seo')"))
        exists = result.scalar()
        
        if exists:
            print("Table 'blog_posts_seo' ALREADY EXISTS.")
        else:
            print("Table 'blog_posts_seo' NOT FOUND. Creating it...")
            # This will create only tables that don't exist
            Base.metadata.create_all(bind=engine)
            print("Table created successfully!")

if __name__ == "__main__":
    migrate()
