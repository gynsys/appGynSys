"""Update a doctor's gallery_width for testing.
Usage: python backend/scripts/update_gallery_width.py <email_or_slug> <new_width>
If first arg contains an @, it will be treated as email, otherwise as slug.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.doctor import Doctor


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/update_gallery_width.py <email_or_slug> <new_width>")
        return
    identifier = sys.argv[1]
    new_width = sys.argv[2]

    db_url = settings.DATABASE_URL
    print(f"Using DB: {db_url}")
    engine = create_engine(db_url, echo=False)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        if '@' in identifier:
            doc = session.query(Doctor).filter(Doctor.email == identifier).first()
        else:
            doc = session.query(Doctor).filter(Doctor.slug_url == identifier).first()
        if not doc:
            doc = session.query(Doctor).first()
            print("Identifier not found; updating first doctor in DB instead.")
        print(f"Before: id={doc.id}, email={doc.email}, slug={doc.slug_url}, gallery_width={getattr(doc, 'gallery_width', None)}")
        doc.gallery_width = new_width
        session.add(doc)
        session.commit()
        print(f"After commit: id={doc.id}, gallery_width={doc.gallery_width}")
    except Exception as e:
        session.rollback()
        print("Error:", e)
    finally:
        session.close()


if __name__ == '__main__':
    main()
