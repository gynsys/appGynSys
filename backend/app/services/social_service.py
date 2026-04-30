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
      
      # Usamos gemini-flash-latest que es el que funciona en este entorno
      model_name = 'gemini-flash-latest' 
      model = genai.GenerativeModel(model_name)

      if generation_type == 'reel':
          prompt = f"""
          Actúa como un experto en marketing digital. 
          Analiza el artículo y crea un guion de Reel.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          Responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura:
          {{
            "hook": "frase inicial",
            "scenes": [
              {{ "time": "00:00", "text": "descripción", "audio": "voz" }}
            ],
            "cta": "llamada a la acción",
            "image_prompts": ["idea 1"]
          }}
          """
      else:
          prompt = f"""
          Actúa como un diseñador de Instagram experto en contenido médico y visualización de datos. 
          Crea un carrusel de 5-10 diapositivas atractivo, profesional y fácil de leer.
          
          ARTÍCULO:
          Título: {post_title}
          Contenido: {post_content}
          
          REGLAS DE FORMATO CRÍTICAS PARA "content":
          1. LISTAS: Si incluyes una lista de puntos o pasos, CADA ITEM DEBE IR EN UNA LÍNEA NUEVA (usa saltos de línea \\n).
          2. VIÑETAS: Usa viñetas modernas como '•' para listas de puntos.
          3. LIMPIEZA: NUNCA amontones varios puntos en un solo párrafo. Cada item debe ser una línea independiente.
          
          Ejemplo de formato deseado para el campo "content":
          "• Item uno\\n• Item dos\\n• Item tres"
          
          Responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura:
          {{
            "slides": [
              {{ "title": "título breve e impactante", "content": "cuerpo con formato limpio y listas si aplica" }}
            ],
            "image_prompts": ["sugerencia de imagen o query para Unsplash"]
          }}
          """

      logger.info(f"Generando {generation_type} con {model_name}...")
      response = model.generate_content(prompt)
      
      if not response or not hasattr(response, 'text'):
          # Verificar si fue bloqueado por seguridad
          if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
              logger.warning(f"Contenido bloqueado por seguridad: {response.prompt_feedback}")
              raise ValueError("El contenido fue bloqueado por los filtros de seguridad de la IA. Por favor intenta con un tema menos sensible.")
          raise ValueError("La IA no devolvió una respuesta válida.")

      text = response.text.strip()
      
      # Intentar extraer JSON de bloques de código o texto libre
      json_match = re.search(r'(\{.*\})', text, re.DOTALL)
      if json_match:
          json_str = json_match.group(1)
          try:
              data = json.loads(json_str)
              # Asegurar que 'slides' sea una lista
              if isinstance(data, dict) and 'slides' in data:
                  if isinstance(data['slides'], dict):
                      logger.warning("IA devolvió slides como objeto, convirtiendo a lista")
                      data['slides'] = list(data['slides'].values())
              return data
          except json.JSONDecodeError:
              # Limpieza agresiva de JSON mal formado
              try:
                  json_str = re.sub(r'//.*', '', json_str) # Quitar comentarios
                  json_str = json_str.replace('\n', ' ').replace('\r', '')
                  json_str = re.sub(r',\s*\}', '}', json_str) # Comas finales en objetos
                  json_str = re.sub(r',\s*\]', ']', json_str) # Comas finales en arreglos
                  return json.loads(json_str)
              except Exception as parse_err:
                  logger.error(f"Fallo total al parsear JSON: {text[:200]}")
                  raise ValueError(f"Error al procesar el formato de la IA: {str(parse_err)}")
      
      raise ValueError(f"No se pudo extraer una estructura válida de la respuesta: {text[:100]}...")

    except Exception as e:
      error_str = str(e)
      if "429" in error_str or "quota" in error_str.lower():
          logger.warning(f"Cuota de IA excedida: {error_str}")
          raise ValueError("Has alcanzado el límite de uso gratuito de la IA por hoy (20 peticiones). Por favor, intenta de nuevo mañana o contacta a soporte para ampliar tu plan.")
      
      logger.error(f"Error crítico en generación social: {e}", exc_info=True)
      raise e
