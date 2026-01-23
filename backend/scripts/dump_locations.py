from app.db.base import get_db, SessionLocal
from app.db.models.location import Location
from sqlalchemy.orm import Session

def dump_locations():
    db = SessionLocal()
    try:
        locations = db.query(Location).all()
        print(f"Found {len(locations)} locations.")
        for loc in locations:
            print(f"ID: {loc.id} | Name: {loc.name} | Schedule: {loc.schedule}")
    finally:
        db.close()

if __name__ == "__main__":
    dump_locations()
