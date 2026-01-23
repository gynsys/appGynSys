#!/usr/bin/env python3
"""
Script to create initial plans (Plan Plata and Plan Oro) in the database.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import get_db
from app.db.models.plan import Plan
from sqlalchemy.orm import Session

def create_initial_plans():
    """Create the initial plans if they don't exist."""
    db: Session = next(get_db())

    try:
        # Check if plans already exist
        existing_plans = db.query(Plan).filter(Plan.name.in_(["Plan Plata", "Plan Oro"])).all()
        if existing_plans:
            print("Plans already exist:")
            for plan in existing_plans:
                print(f"- {plan.name}: ${plan.price}")
            return

        # Create Plan Plata
        plan_plata = Plan(
            name="Plan Plata",
            description="Plan básico con funcionalidades esenciales para doctores",
            price=29.99,
            max_testimonials=10,
            max_gallery_images=20,
            max_faqs=15,
            custom_domain=False,
            analytics_dashboard=False,
            priority_support=False,
            features={
                "testimonials": True,
                "gallery": True,
                "faqs": True,
                "basic_analytics": True,
                "email_support": True
            }
        )

        # Create Plan Oro
        plan_oro = Plan(
            name="Plan Oro",
            description="Plan premium con todas las funcionalidades avanzadas",
            price=49.99,
            max_testimonials=50,
            max_gallery_images=100,
            max_faqs=50,
            custom_domain=True,
            analytics_dashboard=True,
            priority_support=True,
            features={
                "testimonials": True,
                "gallery": True,
                "faqs": True,
                "advanced_analytics": True,
                "custom_domain": True,
                "priority_support": True,
                "api_access": True,
                "white_label": True
            }
        )

        db.add(plan_plata)
        db.add(plan_oro)
        db.commit()

        print("✅ Initial plans created successfully!")
        print(f"- Plan Plata: ${plan_plata.price}/month")
        print(f"- Plan Oro: ${plan_oro.price}/month")

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating plans: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_plans()