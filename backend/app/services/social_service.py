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
      
      # Usamos el nombre de modelo compatible con la versión v1beta de la API
      model_name = 'gemini-1.5-flash-latest' 
      
      generation_config = {
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
      }

      model = genai.GenerativeModel(
        model_name=model_name,
        generation_config=generation_config
      )

      if generation_type == 'reel':
          prompt = f"""
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

      logger.info(f"Iniciando generación {generation_type} con {model_name}...")
      response = model.generate_content(prompt)
      
      json_text = response.text.strip()
      # Limpiar bloques de código markdown si los hay
      if json_text.startswith('```'):
          json_text = re.sub(r'```json\s*|\s*```', '', json_text).strip()
          
      data = json.loads(json_text)
      return data

    except Exception as e:
      logger.error(f"Error crítico en generación social: {e}", exc_info=True)
      # Reintentar sin modo JSON como último recurso si hay un error de modelo
      try:
          logger.info("Reintentando sin Modo JSON para compatibilidad...")
          model_fallback = genai.GenerativeModel('gemini-pro')
          response = model_fallback.generate_content(prompt)
          json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
          if json_match:
              return json.loads(json_match.group())
      except:
          pass
      raise e
