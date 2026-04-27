import google.generativeai as genai
from app.core.config import settings
import logging
import json
import re

logger = logging.getLogger(__name__)

def generate_social_content(post_title: str, post_content: str, generation_type: str) -> dict:
    """
    Generates social media content (Reel or Carousel) based on a blog post.
    """
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        if generation_type == 'reel':
            prompt = f"""
            Eres un experto en marketing digital para médicos. Analiza este artículo de blog y crea un guion para un REEL viral.
            
            Título del blog: {post_title}
            Contenido: {post_content}
            
            Devuelve un JSON estrictamente válido con este formato:
            {{
                "type": "reel",
                "hook": "Un gancho corto y potente para los primeros 3 segundos",
                "scenes": [
                    {{ "time": "0:00-0:05", "text": "Instrucción visual", "audio": "Lo que se dice" }},
                    ... (4-6 escenas)
                ],
                "cta": "Llamada a la acción final"
            }}
            """
        else:
            prompt = f"""
            Eres un experto en marketing digital para médicos. Analiza este artículo de blog y crea la estructura para un CARRUSEL de Instagram (1080x1080).
            
            Título del blog: {post_title}
            Contenido: {post_content}
            
            Devuelve un JSON estrictamente válido con este formato:
            {{
                "type": "carousel",
                "slides": [
                    {{ "title": "Título del slide", "content": "Contenido corto (máx 15 palabras)" }},
                    ... (5-8 slides)
                ],
                "image_prompts": [
                    "Descripción para generar 2 imágenes relacionadas",
                    "..."
                ]
            }}
            """

        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON from markdown if necessary
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return data
        
        raise ValueError("No se pudo extraer JSON de la respuesta de IA")

    except Exception as e:
        logger.error(f"Error in generate_social_content: {str(e)}", exc_info=True)
        raise e
