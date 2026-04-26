import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def generate_blog_content(topic: str, tone: str, target_audience: str, max_words: int) -> str:
    """
    Genera contenido para un artículo de blog médico usando Google Gemini 1.5 Flash.
    
    Args:
        topic: El tema o título del artículo.
        tone: El tono deseado (ej. Profesional, Empático, Informativo).
        target_audience: El público objetivo (ej. Pacientes, Colegas).
        max_words: El número máximo de palabras aproximado.
        
    Returns:
        str: El contenido generado en formato HTML (compatible con editores enriquecidos).
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY no está configurada.")
        raise ValueError("La funcionalidad de IA no está configurada en este momento.")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
        Actúa como un experto en redacción médica y ginecología. 
        Escribe un artículo de blog completo, informativo y profesional sobre el siguiente tema: "{topic}".
        
        Parámetros obligatorios:
        - Tono: {tone}
        - Público objetivo: {target_audience}
        - Extensión deseada: aproximadamente {max_words} palabras.
        - Formato: HTML puro (usa etiquetas <h2>, <h3>, <p>, <ul>, <li>, <strong> para énfasis).
        - Estructura: Título <h2>, Introducción atractiva, desarrollo con varios subtítulos <h3>, y una conclusión con un llamado a la acción profesional.
        - Requisito de contenido: Debe ser médicamente preciso, basado en evidencia pero accesible.
        
        IMPORTANTE: Responde ÚNICAMENTE con el código HTML del cuerpo del artículo. No incluyas ```html, ni etiquetas <html>/<body>, ni comentarios, ni explicaciones. Solo el contenido para insertar en un editor.
        """
        
        logger.info(f"Generando contenido con IA para tema: {topic} (max_words: {max_words})")
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.error("Gemini devolvió una respuesta vacía o inválida.")
            raise ValueError("No se pudo generar el contenido. La IA devolvió una respuesta vacía.")
            
        generated_html = response.text.strip()
        
        # Limpiar posibles bloques de código markdown si la IA ignora las instrucciones
        if generated_html.startswith("```html"):
            generated_html = generated_html.replace("```html", "").replace("```", "").strip()
        elif generated_html.startswith("```"):
            generated_html = generated_html.replace("```", "").strip()
            
        logger.info(f"Contenido generado exitosamente. Longitud: {len(generated_html)} caracteres.")
        return generated_html
        
    except Exception as e:
        logger.error(f"Error al generar contenido con Gemini: {str(e)}", exc_info=True)
        raise ValueError(f"Error en el servicio de IA: {str(e)}")
