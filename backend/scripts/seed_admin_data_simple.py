"""
Seed script for admin system initial data.
Run this after applying migrations to populate initial plans and modules.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base
from app.db.models import Plan, Module


def seed_admin_data():
    """Seed initial admin data: plans and modules."""

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Seed modules
        modules_data = [
            {
                "name": "Testimonios",
                "description": "Sistema de testimonios de pacientes",
                "code": "testimonials",
                "is_active": True
            },
            {
                "name": "Preguntas Frecuentes",
                "description": "Sección de FAQ personalizable",
                "code": "faq",
                "is_active": True
            },
            {
                "name": "Galería",
                "description": "Galería de imágenes del consultorio",
                "code": "gallery",
                "is_active": True
            },
            {
                "name": "Citas",
                "description": "Sistema de agendamiento de citas",
                "code": "appointments",
                "is_active": False  # Not implemented yet
            },
            {
                "name": "Analytics",
                "description": "Dashboard de analíticas y estadísticas",
                "code": "analytics",
                "is_active": False  # Not implemented yet
            }
        ]

        for module_data in modules_data:
            # Check if module already exists
            existing = session.query(Module).filter_by(code=module_data["code"]).first()
            if not existing:
                module = Module(**module_data)
                session.add(module)
                print(f"✅ Created module: {module_data['name']}")

        # Seed plans
        plans_data = [
            {
                "name": "Básico",
                "description": "Plan básico para profesionales independientes",
                "price": 29.99,
                "features": {
                    "max_testimonials": 5,
                    "max_gallery_images": 10,
                    "max_faqs": 5,
                    "custom_domain": False,
                    "analytics": False,
                    "priority_support": False
                },
                "max_testimonials": 5,
                "max_gallery_images": 10,
                "max_faqs": 5,
                "custom_domain": False,
                "analytics_dashboard": False,
                "priority_support": False,
                "is_active": True
            },
            {
                "name": "Profesional",
                "description": "Plan profesional para clínicas pequeñas",
                "price": 49.99,
                "features": {
                    "max_testimonials": 15,
                    "max_gallery_images": 30,
                    "max_faqs": 15,
                    "custom_domain": False,
                    "analytics": True,
                    "priority_support": False
                },
                "max_testimonials": 15,
                "max_gallery_images": 30,
                "max_faqs": 15,
                "custom_domain": False,
                "analytics_dashboard": True,
                "priority_support": False,
                "is_active": True
            },
            {
                "name": "Premium",
                "description": "Plan premium para clínicas establecidas",
                "price": 79.99,
                "features": {
                    "max_testimonials": -1,  # Unlimited
                    "max_gallery_images": -1,  # Unlimited
                    "max_faqs": -1,  # Unlimited
                    "custom_domain": True,
                    "analytics": True,
                    "priority_support": True
                },
                "max_testimonials": -1,
                "max_gallery_images": -1,
                "max_faqs": -1,
                "custom_domain": True,
                "analytics_dashboard": True,
                "priority_support": True,
                "is_active": True
            }
        ]

        for plan_data in plans_data:
            # Check if plan already exists
            existing = session.query(Plan).filter_by(name=plan_data["name"]).first()
            if not existing:
                plan = Plan(**plan_data)
                session.add(plan)
                print(f"✅ Created plan: {plan_data['name']}")

        session.commit()
        print("✅ Admin data seeded successfully!")

    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding admin data: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_admin_data()