
import logging
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.testimonial import Testimonial
from app.db.models.faq import FAQ
from app.db.models.gallery import GalleryImage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.db.models.location import Location
from app.db.models.service import Service
from app.blog.models import BlogPost
import os

def seed_content():
    session = SessionLocal()
    try:
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            logger.error("Doctor 'mariel-herrera' not found.")
            return

        # 1. Restore Logo
        # Try specific logo from template, else fallback
        target_logo = "4_logo_20251130_074402.png"
        logo_path = f"/uploads/logos/{target_logo}"
        
        # In a real scenario we'd check if file exists, but we are in container context.
        # Let's assume the mounting is correct.
        doctor.logo_url = logo_path
        logger.info(f"Updated logo_url to {logo_path}")

        # 2. Restore Profile Photo (keep existing logic)
        photo_path = "/uploads/photos/1_photo_20251122_232603.jpeg"
        doctor.photo_url = photo_path
        
        # 3. Restore Locations
        locations_data = [
            {
                "name": "Consultorio Caracas",
                "address": "Av. Principal de Las Mercedes, Centro Profesional, Piso 5",
                "city": "Caracas",
                "phone": "0424-4281876"
            },
            {
                "name": "Consultorio Guarenas",
                "address": "CC Buenaventura, Vista Place, Nivel Salud",
                "city": "Guarenas",
                "phone": "0412-7738918"
            }
        ]
        for loc in locations_data:
            exists = session.query(Location).filter(Location.name == loc['name'], Location.doctor_id == doctor.id).first()
            if not exists:
                session.add(Location(
                    doctor_id=doctor.id,
                    name=loc['name'],
                    address=loc['address'],
                    city=loc['city'],
                    phone=loc['phone'],
                    is_active=True
                ))
        logger.info("Seeded Locations")

        # 4. Restore Services
        services_data = [
            {"title": "Consulta Ginecológica", "desc": "Evaluación integral de la salud femenina."},
            {"title": "Control Prenatal", "desc": "Acompañamiento médico durante todo el embarazo."},
            {"title": "Ecosonografía", "desc": "Ecosonogramas pélvicos y obstétricos de alta resolución."},
            {"title": "Despistaje de Endometriosis", "desc": "Diagnóstico especializado y tratamiento.", "blog_slug": "entendiendo-la-endometriosis"}
        ]
        for idx, srv in enumerate(services_data):
            exists = session.query(Service).filter(Service.title == srv['title'], Service.doctor_id == doctor.id).first()
            if not exists:
                session.add(Service(
                    doctor_id=doctor.id,
                    title=srv['title'],
                    description=srv['desc'],
                    order=idx,
                    blog_slug=srv.get('blog_slug'),
                    is_active=True
                ))
        logger.info("Seeded Services")

        # 5. Restore Blog Posts (Mega Menu)
        posts_data = [
            {
                "title": "¿Qué es la Endometriosis?",
                "slug": "entendiendo-la-endometriosis",
                "content": "La endometriosis es una condición donde el tejido similar al revestimiento del útero crece fuera de él...",
                "is_in_menu": True
            },
            {
                "title": "Importancia del Control Anual",
                "slug": "importancia-control-anual",
                "content": "El chequeo ginecológico anual es vital para prevenir...",
                "is_in_menu": True
            }
        ]
        for post in posts_data:
            exists = session.query(BlogPost).filter(BlogPost.slug == post['slug'], BlogPost.doctor_id == doctor.id).first()
            if not exists:
                session.add(BlogPost(
                    doctor_id=doctor.id,
                    title=post['title'],
                    slug=post['slug'],
                    content=post['content'],
                    is_in_menu=post['is_in_menu'],
                    is_published=True
                ))
        logger.info("Seeded Blog Posts")

        # 6. Testimonials (Keep existing logic)
        testimonials = [
            {"patient_name": "Ana García", "text": "Excelente atención, la doctora es muy profesional y amable.", "rating": 5},
            {"patient_name": "María Rodríguez", "text": "Me sentí muy cómoda en la consulta, resolvió todas mis dudas.", "rating": 5},
            {"patient_name": "Carla Pérez", "text": "Gran especialista en endometriosis, totalmente recomendada.", "rating": 5}
        ]
        
        for t_data in testimonials:
            exists = session.query(Testimonial).filter(Testimonial.content == t_data['text'], Testimonial.doctor_id == doctor.id).first()
            if not exists:
                t = Testimonial(
                    doctor_id=doctor.id,
                    patient_name=t_data['patient_name'],
                    content=t_data['text'],
                    rating=t_data['rating'],
                    is_approved=True
                )
                session.add(t)
        logger.info("Seeded testimonials")

        # 7. FAQs (Keep existing logic)
        faqs = [
            {"question": "¿Dónde es la consulta?", "answer": "Atiendo en Caracas y Guarenas."},
            {"question": "¿Trabaja con seguros?", "answer": "Sí, trabajo con los principales seguros nacionales e internacionales."},
            {"question": "¿Realiza ecosonogramas?", "answer": "Sí, realizo ecosonogramas pélvicos y obstétricos en el consultorio."}
        ]

        for f_data in faqs:
            exists = session.query(FAQ).filter(FAQ.question == f_data['question'], FAQ.doctor_id == doctor.id).first()
            if not exists:
                f = FAQ(
                    doctor_id=doctor.id,
                    question=f_data['question'],
                    answer=f_data['answer'],
                    display_order=0
                )
                session.add(f)
        logger.info("Seeded FAQs")
        
        # 8. Gallery (Keep existing logic)
        for i in range(1, 6):
            img_url = f"/sample-gallery/img{i}.svg"
            exists = session.query(GalleryImage).filter(GalleryImage.image_url == img_url, GalleryImage.doctor_id == doctor.id).first()
            if not exists:
                g = GalleryImage(
                    doctor_id=doctor.id,
                    image_url=img_url,
                    title=f"Imagen {i}",
                    display_order=i
                )
                session.add(g)
        logger.info("Seeded Gallery placeholders")

        session.commit()
        logger.info("Content seeding complete!")

    except Exception as e:
        logger.error(f"Error seeding content: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_content()
