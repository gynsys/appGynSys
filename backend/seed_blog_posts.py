
import logging
from datetime import datetime
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.blog.models import BlogPost

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_blog_posts():
    session = SessionLocal()
    try:
        doctor = session.query(Doctor).filter(Doctor.slug_url == "mariel-herrera").first()
        if not doctor:
            logger.error("Doctor 'mariel-herrera' not found.")
            return

        posts_data = [
            {
                "title": "La Medicina del Futuro: Visión 2045",
                "slug": "medicina-del-futuro-2045",
                "summary": "Exploramos cómo la inteligencia artificial, la nanotecnología y la genómica revolucionarán la ginecología para el año 2045.",
                "content": """
                <h2>El Amanecer de una Nueva Era Médica</h2>
                <p>Para el año 2045, la medicina habrá dado un salto cuántico. En el campo de la <strong>ginecología</strong>, esperamos ver avances impensables hoy en día.</p>
                
                <h3>Úteros Artificiales y Gestación Externa</h3>
                <p>La tecnología de ectogénesis podría permitir el desarrollo fetal completo fuera del cuerpo humano, ofreciendo esperanza a mujeres con infertilidad uterina grave.</p>

                <h3>Diagnóstico con Nanobots</h3>
                <p>Imaginamos nanobots circulando en el torrente sanguíneo, capaces de detectar marcadores de VPH o células endometriósicas antes de que sean visibles en una ecografía tradicional.</p>

                <h3>Medicina Personalizada y Genómica</h3>
                <p>Los tratamientos hormonales ya no serán 'talla única'. Se diseñarán específicamente basados en el perfil genético único de cada paciente, minimizando efectos secundarios.</p>
                """,
                "is_in_menu": False
            },
            {
                "title": "Estadísticas Alarmantes del VPH en el Mundo",
                "slug": "estadisticas-vph-mundo",
                "summary": "Un análisis profundo sobre la prevalencia del Virus del Papiloma Humano a nivel global y la importancia crítica de la vacunación.",
                "content": """
                <h2>Una Pandemia Silenciosa</h2>
                <p>El <strong>Virus del Papiloma Humano (VPH)</strong> es la infección de transmisión sexual más común del mundo. Se estima que el 80% de las personas sexualmente activas contraerán al menos un tipo de VPH en algún momento de sus vidas.</p>

                <h3>Cifras que Preocupan</h3>
                <ul>
                    <li>Más de 600,000 nuevos casos de cáncer de cuello uterino se diagnostican anualmente, casi todos relacionados con el VPH.</li>
                    <li>La tasa de mortalidad es significativamente mayor en países en vías de desarrollo debido a la falta de acceso a pruebas de Papanicolau (citología).</li>
                </ul>

                <h3>La Vacuna: Nuestra Mejor Arma</h3>
                <p>La vacunación masiva, idealmente antes del inicio de la vida sexual, ha demostrado reducir drásticamente la incidencia de cánceres relacionados con el VPH. No es solo un asunto de mujeres; la vacunación en hombres es crucial para la inmunidad de rebaño.</p>
                """,
                "is_in_menu": True
            },
            {
                "title": "El Desafío del Diagnóstico de la Endometriosis",
                "slug": "dificultad-diagnostico-endometriosis",
                "summary": "¿Por qué tardan en promedio 7 años en diagnosticar la endometriosis? Analizamos las barreras médicas y sociales.",
                "content": """
                <h2>¿Dolor "Normal"? El Gran Mito</h2>
                <p>La principal barrera para el diagnóstico de la <strong>endometriosis</strong> es la normalización del dolor menstrual. Muchas mujeres crecen escuchando que sufrir es parte de ser mujer.</p>

                <h3>La Enfermedad Camaleónica</h3>
                <p>La endometriosis puede presentar síntomas muy variados: desde dolor pélvico crónico e infertilidad, hasta problemas digestivos o urinarios que confunden a los médicos generalistas, llevándolos a diagnósticos erróneos como Síndrome de Intestino Irritable.</p>

                <h3>La Necesidad de Especialistas</h3>
                <p>El diagnóstico definitivo a menudo requiere cirugía laparoscópica o un mapeo ecográfico realizado por un ojo experto. La falta de especialistas entrenados en <em>mapeo de endometriosis</em> contribuye al retraso diagnóstico.</p>
                """,
                "is_in_menu": True
            },
            {
                "title": "Casos Raros: Endometriosis Apendicular",
                "slug": "casos-raros-endometriosis-apendice",
                "summary": "La endometriosis no solo afecta el útero. Reporte sobre casos extragenitales y su complejidad quirúrgica.",
                "content": """
                <h2>Más Allá de la Pelvis</h2>
                <p>Aunque es raro, el tejido endometrial puede migrar a órganos distantes. La <strong>endometriosis apendicular</strong> es una de estas manifestaciones extragenitales poco comunes pero peligrosas.</p>

                <h3>Síntomas Confusos</h3>
                <p>A menudo se presenta como una apendicitis aguda o dolor crónico en fosa ilíaca derecha que empeora con la menstruación (amenorrea catamenial). Esto hace que el diagnóstico preoperatorio sea extremadamente difícil.</p>

                <h3>Tratamiento Quirúrgico</h3>
                <p>El abordaje suele requerir una apendicectomía. Es vital que, durante cualquier laparoscopia por dolor pélvico crónico, el cirujano inspeccione sistemáticamente el apéndice, el diafragma y el intestino.</p>
                """,
                "is_in_menu": False
            },
            {
                "title": "Mitos y Verdades: Embarazo y Ginecología",
                "slug": "mitos-verdades-embarazo",
                "summary": "Desmentimos las creencias populares más arraigadas sobre la gestación y la salud femenina.",
                "content": """
                <h2>Mito 1: 'Debes comer por dos'</h2>
                <p><strong>Falso.</strong> Las necesidades calóricas solo aumentan ligeramente en el segundo y tercer trimestre. El exceso de peso aumenta riesgos de diabetes gestacional y preeclampsia.</p>

                <h2>Mito 2: 'La forma de la barriga predice el sexo'</h2>
                <p><strong>Falso.</strong> La forma depende del tono muscular abdominal de la madre, la posición del feto y la cantidad de embarazos previos, no del sexo del bebé.</p>

                <h2>Mito 3: 'No puedes teñirte el cabello'</h2>
                <p><strong>Verdad a medias.</strong> Se recomienda evitar tintes con amoníaco y esperar idealmente hasta pasado el primer trimestre, pero los productos modernos suelen ser seguros.</p>
                """,
                "is_in_menu": False
            },
            {
                "title": "La Importancia del Control Anual",
                "slug": "importancia-control-anual-ginecologico",
                "summary": "Tu chequeo anual es más que un simple trámite. Es la piedra angular de la medicina preventiva femenina.",
                "content": """
                <h2>Prevenir es Curar</h2>
                <p>Muchas patologías ginecológicas, desde el cáncer de cuello uterino hasta miomas o quistes, son asintomáticas en sus etapas iniciales.</p>

                <h3>¿Qué incluye un chequeo completo?</h3>
                <ul>
                    <li><strong>Citología (Papanicolau):</strong> Para detectar cambios celulares pre-cancerosos.</li>
                    <li><strong>Ecografía Transvaginal:</strong> Para evaluar útero y ovarios.</li>
                    <li><strong>Examen Mamario:</strong> Vital para la detección temprana del cáncer de mama.</li>
                </ul>
                <p>No esperes a sentir dolor. Agenda tu cita anual hoy mismo.</p>
                """,
                "is_in_menu": True
            }
        ]

        logger.info(f"Seeding {len(posts_data)} blog posts for doctor {doctor.slug_url}...")

        created_count = 0
        for post_data in posts_data:
            # Check if exists by slug to avoid duplicates but override if needed? 
            # Ideally we want to ensure these specific ones exist.
            exists = session.query(BlogPost).filter(BlogPost.slug == post_data['slug'], BlogPost.doctor_id == doctor.id).first()
            if not exists:
                new_post = BlogPost(
                    doctor_id=doctor.id,
                    title=post_data['title'],
                    slug=post_data['slug'],
                    summary=post_data['summary'],
                    content=post_data['content'],
                    is_published=True,
                    is_in_menu=post_data['is_in_menu'],
                    published_at=datetime.utcnow()
                )
                session.add(new_post)
                created_count += 1
                logger.info(f"Created post: {post_data['title']}")
            else:
                # Update existing content just in case
                exists.content = post_data['content']
                exists.summary = post_data['summary']
                exists.title = post_data['title']
                exists.is_published = True
                logger.info(f"Updated post: {post_data['title']}")

        session.commit()
        logger.info(f"Success! {created_count} new posts created.")

    except Exception as e:
        logger.error(f"Error seeding blog posts: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_blog_posts()
