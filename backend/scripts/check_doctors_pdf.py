from app.db.session import get_db_session
from app.db.models.doctor import Doctor

try:
    db = next(get_db_session())
    doctors = db.query(Doctor).all()
    for d in doctors:
        print(f"ID: {d.id} | Slug: {d.slug_url} | Name: {d.nombre_completo}")
        print(f"  PDF Config: {d.pdf_config}")
except Exception as e:
    print(f"Error: {e}")
