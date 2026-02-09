"""
Create OAuth whitelist table and migrate .env data
Run this inside the backend container: docker exec appgynsys-backend-1 python create_oauth_table.py
"""
from app.db.base import Base, engine, SessionLocal
from app.db.models.oauth_whitelist import OAuthWhitelist
from app.core.config import settings

print("🔧 Creating oauth_whitelist table...")

# Create table
Base.metadata.create_all(bind=engine, tables=[OAuthWhitelist.__table__])
print("✅ Table created successfully!")

# Migrate .env data
db = SessionLocal()
try:
    # Migrate email whitelist
    for email in settings.oauth_allowed_emails:
        existing = db.query(OAuthWhitelist).filter(OAuthWhitelist.email == email).first()
        if not existing:
            entry = OAuthWhitelist(
                email=email,
                is_active=True,
                notes="Migrated from .env configuration"
            )
            db.add(entry)
            print(f"  ✅ Added email: {email}")
        else:
            print(f"  ⏭️  Email already exists: {email}")
    
    # Migrate domain whitelist
    for domain in settings.oauth_allowed_domains:
        existing = db.query(OAuthWhitelist).filter(OAuthWhitelist.domain == domain).first()
        if not existing:
            entry = OAuthWhitelist(
                domain=domain,
                is_active=True,
                notes="Migrated from .env configuration"
            )
            db.add(entry)
            print(f"  ✅ Added domain: {domain}")
        else:
            print(f"  ⏭️  Domain already exists: {domain}")
    
    db.commit()
    print("\n✅ Migration complete!")
    
    # Show current whitelist
    print("\n📋 Current whitelist:")
    all_entries = db.query(OAuthWhitelist).filter(OAuthWhitelist.is_active == True).all()
    for entry in all_entries:
        if entry.email:
            print(f"  - Email: {entry.email}")
        if entry.domain:
            print(f"  - Domain: {entry.domain}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
