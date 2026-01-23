
import logging
from app.db.base import SessionLocal
from app.db.models.module import Module
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_modules():
    session = SessionLocal()
    try:
        # Define all modules requested by user + existing ones
        # User requested: acreditaciones, galeria, testimonios, preguntas frecuentes, 
        # mis servicios, ubicaciones, destacados, mis recomendaciones.
        
        modules_to_seed = [
            {"name": "Acreditaciones", "code": "certifications", "desc": "Muestra tus certificaciones, diplomas y logros profesionales."},
            {"name": "Galería", "code": "gallery", "desc": "Muestra imágenes de tu consultorio, equipo o resultados."},
            {"name": "Testimonios", "code": "testimonials", "desc": "Comparte las experiencias y opiniones de tus pacientes."},
            {"name": "Preguntas Frecuentes", "code": "faq", "desc": "Resuelve las dudas más comunes de tus pacientes."},
            {"name": "Mis Servicios", "code": "services", "desc": "Detalla los servicios médicos y procedimientos que ofreces."},
            {"name": "Ubicaciones", "code": "locations", "desc": "Muestra la dirección y horarios de tus consultorios."},
            {"name": "Destacados", "code": "highlights", "desc": "Sección especial para resaltar información importante en tu inicio."},
            {"name": "Mis Recomendaciones", "code": "recommendations", "desc": "Productos, libros o servicios que recomiendas a tus pacientes."},
            
            # Existing/Standard modules
            {"name": "Blog", "code": "blog", "desc": "Publica artículos y consejos de salud para tus pacientes."},
            {"name": "Predictor de Ciclos", "code": "cycle_predictor", "desc": "Herramienta para que tus pacientes sigan su ciclo menstrual."},
            {"name": "Preconsulta", "code": "preconsultation", "desc": "Formulario de evaluación previa para nuevas pacientes."},
            {"name": "Citas Online", "code": "appointments", "desc": "Sistema de agendamiento de citas en línea."}
        ]

        logger.info("--- Seeding Modules ---")
        
        for mod_data in modules_to_seed:
            # Check if exists by code
            existing = session.query(Module).filter(Module.code == mod_data['code']).first()
            
            if existing:
                logger.info(f"Using existing module: {mod_data['code']}")
                # Optional: Update name/desc if we want to enforce uniformity
                if existing.name != mod_data['name'] or existing.description != mod_data['desc']:
                     existing.name = mod_data['name']
                     existing.description = mod_data['desc']
                     logger.info(f"  -> Updated details for {mod_data['code']}")
            else:
                new_mod = Module(
                    name=mod_data['name'],
                    code=mod_data['code'],
                    description=mod_data['desc'],
                    is_active=True
                )
                session.add(new_mod)
                logger.info(f"Created new module: {mod_data['code']}")
        
        session.commit()
        logger.info("--- Seeding Complete ---")
        
        # Verify count
        count = session.query(Module).count()
        logger.info(f"Total modules in DB: {count}")

    except Exception as e:
        logger.error(f"Error seeding modules: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_modules()
