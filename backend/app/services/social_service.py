import google.generativeai as genai
from app.core.config import settings
import json
import re
import logging

# Configurar logger estándar
logger = logging.getLogger(__name__)

def generate_social_content(post_title: str, post_content: str, generation_type: str = 'reel'):
    """
    Genera contenido para redes sociales (Reel o Carrusel) usando Gemini.
    """
    try:
      genai.configure(api_key=settings.GEMINI_API_KEY)
      model = genai.GenerativeModel('gemini-flash-latest')

      if generation_type == 'reel':
          prompt = f"""
          Actúa como un experto en marketing digital y Reels virales. 
          Analiza el siguiente artículo de blog y crea un guion de Reel de 30-60 segundos.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          Devuelve un objeto JSON estrictamente con esta estructura:
          {{
            "hook": "Un gancho impactante para los primeros 3 segundos",
            "scenes": [
              {{ "time": "00:00-00:05", "text": "Descripción visual de la escena", "audio": "Lo que se dice o música" }}
            ],
            "cta": "Llamada a la acción final",
            "image_prompts": ["3 ideas de imágenes para este contenido"]
          }}
          """
      else:
          prompt = f"""
          Actúa como un diseñador de contenido para Instagram. 
          Crea un carrusel de 5 a 10 diapositivas basado en este artículo.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          Devuelve un objeto JSON estrictamente con esta estructura:
          {{
            "slides": [
              {{ "title": "Título corto y llamativo", "content": "Texto breve y directo (máximo 150 caracteres)" }}
            ],
            "image_prompts": ["Ideas de imágenes para las diapositivas"]
          }}
          """

      response = model.generate_content(prompt)
      text = response.text
      
      # Limpieza de la respuesta para extraer solo el JSON
      json_match = re.search(r'\{.*\}', text, re.DOTALL)
      if json_match:
          json_str = json_match.group()
          # Limpiar posibles caracteres de control o errores comunes de Gemini
          json_str = json_str.replace('\n', ' ').replace('\r', '')
          # Intentar corregir comas finales antes de cerrar llaves o corchetes
          json_str = re.sub(r',\s*\}', '}', json_str)
          json_str = re.sub(r',\s*\]', ']', json_str)
          
          try:
            data = json.loads(json_str)
            return data
          except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON de Gemini: {e}")
            logger.error(f"Contenido original: {json_str}")
            # Si falla, intentar un último recurso: remover bloques de código markdown
            clean_json = re.sub(r'```json\s*|\s*```', '', text).strip()
            return json.loads(clean_json)
      else:
          raise ValueError("No se encontró un objeto JSON en la respuesta de la IA")

    except Exception as e:
      logger.error(f"Error en generación social: {e}", exc_info=True)
      raise e
