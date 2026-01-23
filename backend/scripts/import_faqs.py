"""
Import hard-coded FAQs for Dr. Mariel Herrera (by slug: mariel-herrera).
Run: python scripts/import_faqs.py
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.base import SessionLocal
from app.db.models.faq import FAQ
from app.db.models.doctor import Doctor

FAQS = [
    {
        "question": "¿Es seguro utilizar el sistema para agendar citas?",
        "answer": "Sí, nuestro sistema utiliza tecnología de encriptación de última generación para proteger toda la información personal y médica. Cumplimos con los estándares de seguridad y privacidad de datos de salud (HIPAA). Toda la información que compartas está completamente segura y solo es accesible por el equipo médico autorizado.",
        "display_order": 1,
    },
    {
        "question": "¿Cómo funciona la pre-consulta?",
        "answer": "La pre-consulta es un formulario digital que puedes completar antes de tu cita. Te permite compartir información relevante sobre tu historial médico, síntomas actuales y medicamentos que estás tomando. Esto ayuda a optimizar el tiempo de consulta y permite que el médico esté mejor preparado para atenderte. Puedes acceder al formulario desde la sección 'Pre-consulta' en esta página.",
        "display_order": 2,
    },
    {
        "question": "¿Puedo reagendar una cita ya agendada?",
        "answer": "Sí, puedes reagendar tu cita. Para hacerlo, puedes contactarnos directamente a través de los medios de comunicación proporcionados en esta página o utilizar el sistema de agendamiento si está disponible. Te recomendamos hacerlo con al menos 24 horas de anticipación para que otro paciente pueda tomar tu horario.",
        "display_order": 3,
    },
    {
        "question": "¿Qué métodos de pago aceptan?",
        "answer": "Aceptamos diversos métodos de pago para tu comodidad, incluyendo efectivo, tarjetas de débito y crédito, y transferencias bancarias. Al momento de agendar tu cita, te informaremos sobre las opciones de pago disponibles y cualquier política de pago que aplique.",
        "display_order": 4,
    },
    {
        "question": "¿Necesito traer algo específico a mi primera consulta?",
        "answer": "Para tu primera consulta, es importante que traigas: tu documento de identidad, cualquier estudio médico previo relacionado con tu condición, lista de medicamentos actuales (si los tomas), y tu tarjeta de seguro médico (si aplica). Si completaste el formulario de pre-consulta, esa información ya estará disponible para el médico.",
        "display_order": 5,
    },
    {
        "question": "¿Cómo puedo acceder a mis resultados de exámenes?",
        "answer": "Los resultados de tus exámenes estarán disponibles a través de nuestro sistema seguro. Te notificaremos cuando estén listos y podrás acceder a ellos ingresando con tus credenciales. Si prefieres, también podemos enviártelos por correo electrónico o entregarlos en persona durante tu próxima visita.",
        "display_order": 6,
    },
    {
        "question": "¿Ofrecen consultas de seguimiento?",
        "answer": "Sí, ofrecemos consultas de seguimiento para monitorear tu progreso y ajustar tu tratamiento según sea necesario. El médico determinará la frecuencia de seguimiento según tu condición específica. Puedes agendar tus consultas de seguimiento de la misma manera que agendaste tu cita inicial.",
        "display_order": 7,
    },
]


def main(doctor_slug: str = "mariel-herrera"):
    db = SessionLocal()
    try:
        # Buscar el doctor por slug
        doctor = db.query(Doctor).filter(Doctor.slug_url == doctor_slug).first()
        
        if not doctor:
            print(f"❌ Error: No se encontró un doctor con el slug '{doctor_slug}'")
            print("💡 Sugerencia: Verifica que el doctor exista en la base de datos")
            return
        
        print(f"✅ Doctor encontrado: {doctor.nombre_completo} (ID: {doctor.id})")
        print(f"📝 Importando {len(FAQS)} preguntas frecuentes...\n")
        
        imported = 0
        skipped = 0
        
        for data in FAQS:
            # Verificar si ya existe una FAQ con la misma pregunta para este doctor
            exists = (
                db.query(FAQ)
                .filter(
                    FAQ.doctor_id == doctor.id,
                    FAQ.question == data["question"],
                )
                .first()
            )
            
            if exists:
                print(f"⏭️  Saltando: '{data['question'][:50]}...' (ya existe)")
                skipped += 1
                continue

            faq = FAQ(
                doctor_id=doctor.id,
                question=data["question"],
                answer=data["answer"],
                display_order=data["display_order"],
            )
            db.add(faq)
            imported += 1
            print(f"✅ Creada: '{data['question'][:50]}...'")

        db.commit()
        print(f"\n🎉 Proceso completado:")
        print(f"   - {imported} FAQs importadas")
        print(f"   - {skipped} FAQs ya existían (omitidas)")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al importar FAQs: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import FAQs for a doctor")
    parser.add_argument(
        "--slug",
        type=str,
        default="mariel-herrera",
        help="Doctor slug URL (default: mariel-herrera)"
    )
    
    args = parser.parse_args()
    main(doctor_slug=args.slug)

