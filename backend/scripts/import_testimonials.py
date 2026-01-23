"""
Import hard-coded testimonials for Dr. Mariel Herrera (doctor_id=1 by default).
Run: python scripts/import_testimonials.py
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.base import SessionLocal
from app.db.models.testimonial import Testimonial

TESTIMONIALS = [
    {
        "patient_name": "María López",
        "patient_email": "maria@example.com",
        "photo_url": None,
        "content": "Recibí un trato excelente y los resultados fueron los esperados.",
        "rating": 5,
        "is_featured": False,
    },
    {
        "patient_name": "Sofía Martínez",
        "patient_email": "sofia@example.com",
        "photo_url": None,
        "content": "Profesionales y empáticos. Me sentí en buenas manos durante todo el proceso.",
        "rating": 5,
        "is_featured": False,
    },
    {
        "patient_name": "Ana Pérez",
        "patient_email": "ana@example.com",
        "photo_url": None,
        "content": "Excelente atención, muy profesional y cercana. Recomiendo 100%.",
        "rating": 5,
        "is_featured": True,
    },
    {
        "patient_name": "Carla Ruiz",
        "patient_email": "carla@example.com",
        "photo_url": None,
        "content": "Me ayudaron mucho con mi problema, el seguimiento fue impecable.",
        "rating": 5,
        "is_featured": False,
    },
    {
        "patient_name": "Laura Gómez",
        "patient_email": "laura@example.com",
        "photo_url": None,
        "content": "Muy satisfactoria la experiencia. El equipo es amable y profesional.",
        "rating": 4,
        "is_featured": False,
    },
]


def main(doctor_id: int = 1):
    db = SessionLocal()
    try:
        for data in TESTIMONIALS:
            exists = (
                db.query(Testimonial)
                .filter(
                    Testimonial.doctor_id == doctor_id,
                    Testimonial.patient_name == data["patient_name"],
                )
                .first()
            )
            if exists:
                continue

            testimonial = Testimonial(
                doctor_id=doctor_id,
                patient_name=data["patient_name"],
                patient_email=data["patient_email"],
                photo_url=data["photo_url"],
                content=data["content"],
                rating=data["rating"],
                is_featured=data["is_featured"],
                is_approved=True,
            )
            db.add(testimonial)

        db.commit()
        print("Testimonios importados correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    main(doctor_id=1)

