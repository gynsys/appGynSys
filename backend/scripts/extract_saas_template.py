import sys
import os
import json
import psycopg2
from app.core.config import settings

# Force app directory into path
sys.path.insert(0, "/app")
os.environ["PYTHONPATH"] = "/app"

def extract_template():
    url = settings.DATABASE_URL
    import re
    match = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", url)
    if not match:
        print("[ERROR] Could not parse DATABASE_URL")
        return

    user, password, host, port, dbname = match.groups()
    
    try:
        conn = psycopg2.connect(
            dbname=dbname, user=user, password=password, host=host, port=port
        )
        cursor = conn.cursor()
        
        # 1. Profile Info
        cursor.execute("SELECT nombre_completo, especialidad, universidad, biografia, services_section_title, contact_email FROM doctors WHERE id = 1")
        prof = cursor.fetchone()
        profile_info = {
            "nombre_completo": "Dr/a. Nombre Genérico",
            "especialidad": "Tu Especialidad Aquí",
            "universidad": "Universidad de Graduación",
            "biografia": "<p>Bienvenido a mi consulta. Edita esta biografía desde el panel administrativo para informar a tus pacientes sobre tu trayectoria y enfoque médico.</p>",
            "services_section_title": "Mis Servicios",
            "contact_email": "soporte@gynsys.net",
            "role": "user"
        }
        
        # 2. Theme Config
        cursor.execute("SELECT theme_primary_color, theme_body_bg_color, theme_container_bg_color, card_shadow, container_shadow FROM doctors WHERE id = 1")
        theme = cursor.fetchone()
        theme_config = {
            "theme_primary_color": theme[0] if theme else "#4F46E5",
            "theme_body_bg_color": theme[1] if theme else "#f9fafb",
            "theme_container_bg_color": theme[2] if theme else "#ffffff",
            "card_shadow": theme[3] if theme is not None else True,
            "container_shadow": theme[4] if theme is not None else True
        }

        # 3. Services
        cursor.execute("SELECT title, description, image_url, \"order\" FROM services WHERE doctor_id = 1")
        services = []
        for s in cursor.fetchall():
            services.append({
                "title": f"Servicio: {s[0]}",
                "description": "Describe aquí en qué consiste este servicio médico.",
                "image_url": s[2],
                "order": s[3]
            })

        # 4. FAQs
        cursor.execute("SELECT question, answer, display_order FROM faqs WHERE doctor_id = 1")
        faqs = []
        for f in cursor.fetchall():
            faqs.append({
                "question": f"Pregunta: {f[0]}",
                "answer": "Escribe aquí la respuesta a la duda frecuente.",
                "order": f[2]
            })

        # 5. Testimonials
        cursor.execute("SELECT patient_name, content, photo_url, rating FROM testimonials WHERE doctor_id = 1")
        testimonials = []
        for t in cursor.fetchall():
            testimonials.append({
                "name": "Paciente Satisfecho",
                "content": "Escribe aquí un testimonio representativo de tu atención médica.",
                "photo_url": t[2],
                "rating": t[3]
            })

        # 6. Preconsultation Questions
        cursor.execute("SELECT question_text, question_type, options, is_required, \"order\", category FROM preconsultation_questions WHERE doctor_id = 1")
        questions = []
        for q in cursor.fetchall():
            questions.append({
                "question_text": q[0],
                "question_type": q[1],
                "options": q[2],
                "is_required": q[3],
                "order": q[4],
                "category": q[5]
            })

        template = {
            "profile_info": profile_info,
            "theme_config": theme_config,
            "social_media": {
                "social_youtube": None,
                "social_instagram": "tu_instagram",
                "social_tiktok": None,
                "social_x": None,
                "social_facebook": None
            },
            "custom_images": {
                "logo_url": None,
                "photo_url": "/pwa-192x192.png" # Generic placeholder
            },
            "certifications": [],
            "show_certifications_carousel": False,
            "services": services,
            "faqs": faqs,
            "testimonials": testimonials,
            "preconsultation_questions": questions,
            "schedule": None,
            "pdf_config": None,
            "enabled_modules": ["cycle", "consultations", "appointments"]
        }
        
        output_path = "/app/mariel_herrera_template.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
            
        print(f"[SUCCESS] Template extracted to {output_path}")
        
        conn.close()
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    extract_template()
