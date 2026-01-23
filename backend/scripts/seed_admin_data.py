"""
Seed script for admin system initial data.
Run this after applying migrations to populate initial plans and modules.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import json
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.db.models import Plan, Module


async def seed_admin_data():
    """Seed initial admin data: plans and modules."""

    # Create async engine
    db_url = settings.DATABASE_URL
    if "sqlite" in db_url:
        db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")
    elif "postgresql" in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        # Create tables if they don't exist
        from app.db.base import Base
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
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
                existing = await session.execute(
                    text("SELECT id FROM modules WHERE code = :code"),
                    {"code": module_data["code"]}
                )
                if not existing.fetchone():
                    await session.execute(
                        text("""
                        INSERT INTO modules (name, description, code, is_active, created_at, updated_at)
                        VALUES (:name, :description, :code, :is_active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """),
                        module_data
                    )

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
                existing = await session.execute(
                    text("SELECT id FROM plans WHERE name = :name"),
                    {"name": plan_data["name"]}
                )
                if not existing.fetchone():
                    # Prepare params
                    params = plan_data.copy()
                    params["features"] = json.dumps(plan_data["features"])
                    
                    await session.execute(
                        text("""
                        INSERT INTO plans (name, description, price, features, max_testimonials,
                                         max_gallery_images, max_faqs, custom_domain,
                                         analytics_dashboard, priority_support, is_active,
                                         created_at, updated_at)
                        VALUES (:name, :description, :price, :features, :max_testimonials,
                                :max_gallery_images, :max_faqs, :custom_domain,
                                :analytics_dashboard, :priority_support, :is_active,
                                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """),
                        params
                    )

            await session.commit()
            print("✅ Admin data seeded successfully!")

        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding admin data: {e}")
            raise
        finally:
            await session.close()


if __name__ == "__main__":
    asyncio.run(seed_admin_data())