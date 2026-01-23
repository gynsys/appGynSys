from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.doctor import Doctor
from app.db.models.faq import FAQ
from app.db.models.testimonial import Testimonial

def populate_data():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Find Mariel
    slug = "mariel-herrera"
    doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
    
    if not doctor:
        # Fallback to the test doctor if mariel-herrera slug was changed or not found
        slug = "mariel-herrera-test"
        doctor = session.query(Doctor).filter(Doctor.slug_url == slug).first()
        
    if not doctor:
        print("Doctor not found.")
        return

    print(f"Populating data for: {doctor.nombre_completo} (ID: {doctor.id})")

    # --- FAQs (6 items) ---
    faqs_data = [
        {
            "question": "¿Cuáles son los horarios de atención?",
            "answer": "Atendemos de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM. Se requiere cita previa."
        },
        {
            "question": "¿Aceptan seguros médicos?",
            "answer": "Sí, trabajamos con la mayoría de los seguros médicos nacionales e internacionales. Por favor contáctenos para verificar su cobertura específica."
        },
        {
            "question": "¿Qué debo llevar a mi primera consulta?",
            "answer": "Para su primera visita, por favor traiga su identificación, tarjeta de seguro, y cualquier estudio o análisis previo relevante. Es recomendable llegar 15 minutos antes."
        },
        {
            "question": "¿Realizan ultrasonidos en el consultorio?",
            "answer": "Sí, contamos con equipo de ultrasonido de última generación para realizar ecografías pélvicas y obstétricas durante su consulta."
        },
        {
            "question": "¿Cómo puedo agendar una cita?",
            "answer": "Puede agendar su cita directamente a través de este sitio web haciendo clic en 'Agendar Cita', o llamando a nuestro consultorio al número que aparece en el pie de página."
        },
        {
            "question": "¿Tratan problemas de fertilidad?",
            "answer": "Realizamos evaluaciones iniciales de fertilidad y tratamientos básicos. Para casos de alta complejidad, trabajamos en conjunto con especialistas en reproducción asistida."
        }
    ]

    print("Adding FAQs...")
    for i, item in enumerate(faqs_data):
        faq = FAQ(
            doctor_id=doctor.id,
            question=item["question"],
            answer=item["answer"],
            display_order=i
        )
        session.add(faq)

    # --- Testimonials (7 items) ---
    testimonials_data = [
        {
            "patient_name": "Ana García",
            "content": "La Dra. Mariel es excelente. Me hizo sentir muy cómoda desde el primer momento y explicó todo con mucha claridad. ¡Muy recomendada!",
            "rating": 5,
            "is_featured": True
        },
        {
            "patient_name": "Laura Martínez",
            "content": "Llevé mi control de embarazo con ella y fue la mejor decisión. Siempre atenta a mis dudas y muy profesional en cada revisión.",
            "rating": 5,
            "is_featured": True
        },
        {
            "patient_name": "Sofía Rodríguez",
            "content": "Excelente atención y trato humano. Las instalaciones son muy modernas y limpias. Me ayudó mucho con mi problema hormonal.",
            "rating": 5,
            "is_featured": False
        },
        {
            "patient_name": "Carmen López",
            "content": "Muy buena doctora, se toma el tiempo necesario para revisarte y escucharte. No te sientes apresurada como en otros lugares.",
            "rating": 4,
            "is_featured": False
        },
        {
            "patient_name": "Patricia Sánchez",
            "content": "Gracias a la Dra. Herrera pude detectar a tiempo un problema que otros habían pasado por alto. Estaré siempre agradecida.",
            "rating": 5,
            "is_featured": True
        },
        {
            "patient_name": "Elena Torres",
            "content": "El sistema de citas es muy eficiente y la doctora es muy puntual. La recomiendo ampliamente para cualquier mujer que busque una ginecóloga de confianza.",
            "rating": 5,
            "is_featured": False
        },
        {
            "patient_name": "Isabel Díaz",
            "content": "Trato amable y profesional. Me explicó detalladamente mi tratamiento y estuvo pendiente de mi evolución. Gran doctora.",
            "rating": 5,
            "is_featured": False
        }
    ]

    print("Adding Testimonials...")
    for item in testimonials_data:
        testimonial = Testimonial(
            doctor_id=doctor.id,
            patient_name=item["patient_name"],
            content=item["content"],
            rating=item["rating"],
            is_approved=True, # Auto-approve for display
            is_featured=item["is_featured"]
        )
        session.add(testimonial)

    session.commit()
    print("Successfully populated data!")

if __name__ == "__main__":
    populate_data()
