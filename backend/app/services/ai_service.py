import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def generate_blog_content(topic: str, tone: str, target_audience: str) -> str:
    """
    Genera contenido para un artículo de blog médico usando Google Gemini 1.5 Flash.
    
    Args:
        topic: El tema o título del artículo.
        tone: El tono deseado (ej. Profesional, Empático, Informativo).
        target_audience: El público objetivo (ej. Pacientes, Colegas).
        
    Returns:
        str: El contenido generado en formato HTML (compatible con editores enriquecidos).
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY no está configurada.")
        raise ValueError("La funcionalidad de IA no está configurada en este momento.")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Actúa como un experto en redacción médica y ginecología. 
        Escribe un artículo de blog completo y profesional sobre el siguiente tema: "{topic}".
        
        Parámetros del artículo:
        - Tono: {tone}
        - Público objetivo: {target_audience}
        - Formato: HTML (usa etiquetas <h2>, <h3>, <p>, <ul>, <li>, <strong> para énfasis).
        - Estructura: Introducción atractiva, desarrollo con puntos clave y una conclusión con un llamado a la acción (CTA) para consultar con un especialista.
        - Requisito: El contenido debe ser médicamente preciso pero fácil de entender para el público objetivo. No incluyas descargos de responsabilidad médicos genéricos al final, solo el contenido del artículo.
        
        Genera solo el contenido del artículo envuelto en etiquetas HTML, sin bloques de código ```html ni explicaciones adicionales.
        """
        
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.error("Gemini devolvió una respuesta vacía.")
            raise ValueError("No se pudo generar el contenido. Por favor intenta de nuevo.")
            
        return response.text
        
    except Exception as e:
        logger.error(f"Error al generar contenido con Gemini: {str(e)}", exc_info=True)
        raise ValueError(f"Error en el servicio de IA: {str(e)}")
