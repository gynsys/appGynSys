
import json
import logging
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.db.models.plan import Plan

def seed_mariel():
    session = SessionLocal()
    try:
        # Get a valid plan
        plan = session.query(Plan).first()
        if not plan:
            logger.info("No plans found. Creating default plan...")
            plan = Plan(
                name="Plan Básico",
                description="Plan inicial",
                price=0,
                is_active=True,
                features={}
            )
            session.add(plan)
            session.flush()
        
        plan_id = plan.id
        logger.info(f"Using Plan ID: {plan_id}")

        # Load template data if available
        template_data = {}
        try:
            with open('mariel_herrera_template.json', 'r', encoding='utf-8') as f:
                template_data = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load template, using defaults: {e}")

        # Check if doctor exists
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        
        if doctor:
            logger.info("Doctor 'mariel-herrera' already exists. Updating...")
        else:
            logger.info("Doctor 'mariel-herrera' not found. Creating...")
            doctor = Doctor(
                slug_url="mariel-herrera",
                email="mariel@example.com",
                password_hash=pwd_context.hash("password123"),
                is_active=True,
                status="active", # Important: active default
                payment_reference="SEED_DATA",
                plan_id=plan_id, 
                nombre_completo="Dra. Mariel Herrera"
            )
            session.add(doctor)
            session.flush() # Get ID

        # Apply basic info
        doctor.is_active = True
        doctor.status = "active"
        
        # Apply template info if available
        if template_data:
            profile = template_data.get('profile_info', {})
            doctor.especialidad = profile.get('especialidad', "Ginecología y Obstetricia")
            doctor.universidad = profile.get('universidad', "Universidad Central")
            doctor.biografia = profile.get('biografia', "Biografía de ejemplo...")
            doctor.services_section_title = profile.get('services_section_title', "Mis Servicios")
            doctor.contact_email = profile.get('contact_email', "contacto@mariel.com")
            
            theme = template_data.get('theme_config', {})
            doctor.theme_primary_color = theme.get('theme_primary_color', '#e91e63')
            doctor.theme_body_bg_color = theme.get('theme_body_bg_color', '#ffffff')
            doctor.theme_container_bg_color = theme.get('theme_container_bg_color', '#ffffff')
            doctor.card_shadow = theme.get('card_shadow', True)
            doctor.container_shadow = theme.get('container_shadow', True)

            # Apply images
            images = template_data.get('custom_images', {})
            if images.get('logo_url'): doctor.logo_url = images['logo_url']
            if images.get('photo_url'): doctor.photo_url = images['photo_url']

            # Apply certifications
            doctor.show_certifications_carousel = template_data.get('show_certifications_carousel', False)
            
            # Restore certifications (clear old ones first if needed, but here we assume clean start or update)
            from app.db.models.doctor import DoctorCertification
            session.query(DoctorCertification).filter(DoctorCertification.doctor_id == doctor.id).delete()
            
            cert_list = template_data.get('certifications', [])
            for c_data in cert_list:
                new_cert = DoctorCertification(
                    doctor_id=doctor.id,
                    name=c_data['name'],
                    title=c_data['title'],
                    logo_url=c_data['logo_url'],
                    order=c_data.get('order', 0)
                )
                session.add(new_cert)

        session.commit()
        logger.info("Successfully seeded/updated 'mariel-herrera'")
        
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_mariel()
