import sqlite3
import os

db_path = 'gynsys.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("""
    CREATE TABLE IF NOT EXISTS blog_posts_seo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        meta_title VARCHAR,
        meta_description VARCHAR,
        focus_keyword VARCHAR,
        canonical_url VARCHAR,
        schema_type VARCHAR DEFAULT 'Article',
        robots_index BOOLEAN DEFAULT 1,
        robots_follow BOOLEAN DEFAULT 1,
        social_title VARCHAR,
        social_description VARCHAR,
        social_image VARCHAR,
        seo_score INTEGER DEFAULT 0,
        last_validation TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES blog_posts(id)
    )
    """)
    # Unique index on post_id
    c.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_blog_posts_seo_post_id ON blog_posts_seo (post_id)")
    print("Ensured blog_posts_seo table")
except Exception as e:
    print(f"blog_posts_seo error: {e}")

conn.commit()
conn.close()
