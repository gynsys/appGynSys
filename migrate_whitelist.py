#!/usr/bin/env python3
"""
Migrate existing .env whitelist entries to database.
"""

from app.db.base import SessionLocal
from app.core.config import settings
from app.core.oauth_utils import add_email_to_whitelist

db = SessionLocal()

try:
    # Migrate emails from .env
    migrated_emails = []
    for email in settings.oauth_allowed_emails:
        try:
            add_email_to_whitelist(
                email=email,
                db=db,
                added_by_id=None,  # System migration
                notes="Migrated from .env configuration"
            )
            migrated_emails.append(email)
            print(f"✅ Migrated email: {email}")
        except Exception as e:
            print(f"❌ Failed to migrate {email}: {e}")
    
    # Migrate domains from .env
    migrated_domains = []
    for domain in settings.oauth_allowed_domains:
        try:
            from app.db.models.oauth_whitelist import OAuthWhitelist
            # Check if already exists
            existing = db.query(OAuthWhitelist).filter(OAuthWhitelist.domain == domain).first()
            if not existing:
                domain_entry = OAuthWhitelist(
                    domain=domain,
                    is_active=True,
                    notes="Migrated from .env configuration"
                )
                db.add(domain_entry)
                db.commit()
                migrated_domains.append(domain)
                print(f"✅ Migrated domain: {domain}")
            else:
                print(f"⏭️  Domain already exists: {domain}")
        except Exception as e:
            print(f"❌ Failed to migrate domain {domain}: {e}")
            db.rollback()
    
    print(f"\n✅ Migration complete!")
    print(f"   Emails: {len(migrated_emails)} migrated")
    print(f"   Domains: {len(migrated_domains)} migrated")
    
finally:
    db.close()
