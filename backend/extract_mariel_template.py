from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
import json

def extract_mariel_template():
    """Extrae la configuración completa del perfil de la Dra. Mariel Herrera como plantilla."""
    session = SessionLocal()

    # Buscar el perfil de Mariel Herrera
    doctor = session.query(Doctor).filter(Doctor.slug_url == 'mariel-herrera').first()

    if not doctor:
        print("No se encontró el perfil de la Dra. Mariel Herrera")
        return

    # Extraer toda la configuración relevante
    template = {
        "profile_info": {
            "nombre_completo": doctor.nombre_completo,
            "especialidad": doctor.especialidad,
            "universidad": doctor.universidad,
            "biografia": doctor.biografia,
            "services_section_title": doctor.services_section_title,
            "contact_email": doctor.contact_email,
            "role": doctor.role
        },
        "theme_config": {
            "theme_primary_color": doctor.theme_primary_color,
            "theme_body_bg_color": doctor.theme_body_bg_color,
            "theme_container_bg_color": doctor.theme_container_bg_color,
            "card_shadow": doctor.card_shadow,
            "container_shadow": doctor.container_shadow
        },
        "social_media": {
            "social_youtube": doctor.social_youtube,
            "social_instagram": doctor.social_instagram,
            "social_tiktok": doctor.social_tiktok,
            "social_x": doctor.social_x,
            "social_facebook": doctor.social_facebook
        },
        "custom_images": {
            "logo_url": doctor.logo_url,
            "photo_url": doctor.photo_url
        },
        "certifications": [
            {
                "name": cert.name,
                "title": cert.title,
                "logo_url": cert.logo_url,
                "order": cert.order
            } for cert in doctor.certifications
        ],
        "show_certifications_carousel": doctor.show_certifications_carousel,
        "schedule": doctor.schedule,
        "pdf_config": doctor.pdf_config,
        "enabled_modules": doctor.enabled_module_codes
    }

    session.close()

    # Guardar la plantilla en un archivo JSON
    with open('mariel_herrera_template.json', 'w', encoding='utf-8') as f:
        json.dump(template, f, ensure_ascii=False, indent=2)

    print("Plantilla extraída y guardada en 'mariel_herrera_template.json'")
    print("\nConfiguración extraída:")
    print(f"- Nombre: {template['profile_info']['nombre_completo']}")
    print(f"- Especialidad: {template['profile_info']['especialidad']}")
    print(f"- Universidad: {template['profile_info']['universidad']}")
    print(f"- Color primario: {template['theme_config']['theme_primary_color']}")
    print(f"- Módulos habilitados: {template['enabled_modules']}")

    return template

if __name__ == "__main__":
    extract_mariel_template()