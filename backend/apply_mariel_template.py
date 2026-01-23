import json
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor

def apply_mariel_template_to_doctor(doctor_slug: str):
    """Aplica la plantilla de la Dra. Mariel Herrera a otro doctor."""

    # Cargar la plantilla
    try:
        with open('mariel_herrera_template.json', 'r', encoding='utf-8') as f:
            template = json.load(f)
    except FileNotFoundError:
        print("Error: No se encontró el archivo 'mariel_herrera_template.json'")
        print("Ejecuta primero: python extract_mariel_template.py")
        return

    session = SessionLocal()

    # Buscar el doctor destino
    doctor = session.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()

    if not doctor:
        print(f"No se encontró el doctor con slug: {doctor_slug}")
        session.close()
        return

    print(f"Aplicando plantilla a: {doctor.nombre_completo} (slug: {doctor_slug})")

    # Aplicar configuración del perfil (excepto nombre y email)
    profile_info = template['profile_info']
    doctor.especialidad = profile_info['especialidad']
    doctor.universidad = profile_info['universidad']
    doctor.biografia = profile_info['biografia']
    doctor.services_section_title = profile_info['services_section_title']
    doctor.contact_email = profile_info['contact_email']

    # Aplicar configuración de tema
    theme_config = template['theme_config']
    doctor.theme_primary_color = theme_config['theme_primary_color']
    doctor.theme_body_bg_color = theme_config['theme_body_bg_color']
    doctor.theme_container_bg_color = theme_config['theme_container_bg_color']
    doctor.card_shadow = theme_config['card_shadow']
    doctor.container_shadow = theme_config['container_shadow']

    # Aplicar redes sociales
    social_media = template['social_media']
    doctor.social_youtube = social_media['social_youtube']
    doctor.social_instagram = social_media['social_instagram']
    doctor.social_tiktok = social_media['social_tiktok']
    doctor.social_x = social_media['social_x']
    doctor.social_facebook = social_media['social_facebook']

    # Aplicar horario y configuración PDF
    doctor.schedule = template['schedule']
    doctor.pdf_config = template['pdf_config']

    # Nota: Los módulos habilitados requieren lógica adicional para tenant_modules

    session.commit()
    session.close()

    print("✅ Plantilla aplicada exitosamente")
    print(f"Color primario: {doctor.theme_primary_color}")
    print(f"Especialidad: {doctor.especialidad}")
    print(f"Servicios título: {doctor.services_section_title}")

def list_available_templates():
    """Lista las plantillas disponibles."""
    import os
    templates = [f for f in os.listdir('.') if f.endswith('_template.json')]
    if templates:
        print("Plantillas disponibles:")
        for template in templates:
            print(f"  - {template}")
    else:
        print("No hay plantillas disponibles")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Uso:")
        print("  python apply_mariel_template.py list  # Ver plantillas disponibles")
        print("  python apply_mariel_template.py <doctor_slug>  # Aplicar plantilla a doctor")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_available_templates()
    else:
        doctor_slug = command
        apply_mariel_template_to_doctor(doctor_slug)