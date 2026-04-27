import google.generativeai as genai
from app.core.config import settings
import json
import re
import logging

# Configurar logger estándar
logger = logging.getLogger(__name__)

def generate_social_content(post_title: str, post_content: str, generation_type: str = 'reel'):
    """
    Genera contenido para redes sociales (Reel o Carrusel) usando Gemini en Modo JSON.
    """
    try:
      genai.configure(api_key=settings.GEMINI_API_KEY)
      
      # Configuración de la generación para forzar Modo JSON
      generation_config = {
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
      }

      model = genai.GenerativeModel(
        model_name='gemini-1.5-flash', # Usamos la versión estable que soporta JSON mode
        generation_config=generation_config
      )

      if generation_type == 'reel':
          prompt = f"""
          Actúa como un experto en marketing digital. 
          Analiza el artículo y crea un guion de Reel.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          Responde estrictamente con este esquema JSON:
          {{
            "hook": "string",
            "scenes": [
              {{ "time": "string", "text": "string", "audio": "string" }}
            ],
            "cta": "string",
            "image_prompts": ["string"]
          }}
          """
      else:
          prompt = f"""
          Actúa como un diseñador de Instagram. 
          Crea un carrusel de 5-10 diapositivas.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          Responde estrictamente con este esquema JSON:
          {{
            "slides": [
              {{ "title": "string", "content": "string" }}
            ],
            "image_prompts": ["string"]
          }}
          """

      logger.info(f"Generando {generation_type} en Modo JSON...")
      response = model.generate_content(prompt)
      
      try:
        # En Modo JSON, Gemini suele devolver el JSON directamente o dentro de un bloque
        json_text = response.text.strip()
        # Eliminar posibles decoradores de markdown si existieran
        if json_text.startswith('```'):
            json_text = re.sub(r'```json\s*|\s*```', '', json_text).strip()
            
        data = json.loads(json_text)
        return data
      except json.JSONDecodeError as e:
        logger.error(f"Fallo en Modo JSON: {e}. Reintentando limpieza manual...")
        # Fallback a limpieza manual si el modo JSON falla (poco probable)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        raise e

    except Exception as e:
      logger.error(f"Error crítico en generación social: {e}", exc_info=True)
      raise e
