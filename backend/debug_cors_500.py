
import sys
import os
from pathlib import Path

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import desc

from app.db.models.doctor import Doctor
from app.db.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialPublic
from app.core.config import settings

def debug_testimonials():
    # Setup DB connection
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        doctor_slug = "mariel-herrera"
        doctor = db.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()
        
        if not doctor:
            print("Doctor not found")
            return

        testimonials = db.query(Testimonial).filter(
            Testimonial.doctor_id == doctor.id,
            Testimonial.is_approved == True
        ).order_by(
            desc(Testimonial.is_featured),
            desc(Testimonial.created_at)
        ).all()

        print(f"Found {len(testimonials)} approved testimonials")

        failed_count = 0
        for t in testimonials:
            try:
                # Try to validate
                model = TestimonialPublic.model_validate(t)
            except Exception as e:
                print(f"FAILED testimonial {t.id} - {t.patient_name}: {e}")
                failed_count += 1
        
        if failed_count == 0:
            print("ALL TESTIMONIALS VALIDATED SUCCESSFULLY")
        else:
            print(f"FOUND {failed_count} FAILURES")
                
    finally:
        db.close()

if __name__ == "__main__":
    debug_testimonials()
