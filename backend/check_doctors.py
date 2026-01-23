from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

db = SessionLocal()
doctors = db.query(Doctor).all()
target_slug = "mariel-herrera"
found = False
for d in doctors:
    if d.slug_url == target_slug:
        found = True
        try:
            print(f"FOUND: ID: {d.id}, Name: {d.nombre_completo}, Slug: '{d.slug_url}', Active: {d.is_active}")
        except Exception:
             print(f"FOUND: ID: {d.id}, Slug: '{d.slug_url}', Active: {d.is_active} (Name encoding error)")
        break

if not found:
    print(f"Doctor with slug '{target_slug}' NOT FOUND.")
