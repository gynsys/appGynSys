import google.generativeai as genai
from app.core.config import settings
import json
import re
import logging
import requests

# Configurar logger estándar
logger = logging.getLogger(__name__)

def clean_content_for_ai(content: str) -> str:
    """
    Limpia el contenido de etiquetas HTML y remueve datos Base64 pesados 
    para evitar confundir a la IA o exceder límites de tokens.
    """
    if not content:
        return ""
        
    # 1. Remover etiquetas <img> completas (incluyendo base64)
    content = re.sub(r'<img[^>]*>', ' [imagen] ', content)
    
    # 2. Remover cualquier rastro de data:image/base64 por si acaso
    content = re.sub(r'data:image/[^;]*;base64,[^"\'\s]*', '', content)
    
    # 3. Remover otras etiquetas HTML pero mantener el texto
    content = re.sub(r'<[^>]+>', ' ', content)
    
    # 4. Limpiar espacios extra
    content = re.sub(r'\s+', ' ', content).strip()
    
    return content[:15000] # Limitar a 15k caracteres para seguridad

def generate_with_groq(prompt: str):
    """
    Intenta generar el contenido usando Groq como respaldo.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("Groq API Key no configurada.")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "Eres un experto en diseño de carruseles médicos e Instagram. Debes responder SIEMPRE en formato JSON. Si generas contenido para Reels, envuelve las 1 o 2 palabras clave de cada frase entre asteriscos (ej: **palabra**) para resaltarlas."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"}
    }
    
    try:
        logger.info("Intentando generación con Groq (Llama 3.1 70B)...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code != 200:
            logger.error(f"Groq API Error: {response.text}")
        response.raise_for_status()
        data = response.json()
        content = data['choices'][0]['message']['content']
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error en Groq: {str(e)}")
        raise e

def generate_social_content(post_title: str, post_content: str, generation_type: str = 'reel'):
    """
    Genera contenido para redes sociales (Reel o Carrusel) usando Gemini con respaldo en Groq.
    """
    # Limpiar el contenido antes de procesar
    clean_text = clean_content_for_ai(post_content)
    
    if generation_type in ['video', 'reel']:
        prompt = f"""
        Actúa como un experto en neuro-copywriting médico y editor de video viral para Instagram Reels. 
        Tu misión es TRANSFORMAR el contenido médico en una secuencia de video (Reel) altamente persuasiva, empática y que genere curiosidad inmediata.
        
        CONTENIDO ORIGINAL:
        Título: {post_title}
        Contenido: {clean_text}
        
        REGLAS DE ORO PARA EL GUION (REEL):
        1. LÍMITE DE PALABRAS ESTRICTO: Cada diapositiva DEBE tener entre 8 y 12 palabras. Ni más, ni menos.
        2. GANCHO (HOOK): La primera diapositiva debe ser un gancho irresistible que detenga el scroll (ej: "¿Sabías que...", "Lo que nadie te dice sobre...", "3 señales de...").
        3. PSICOLOGÍA: Usa un tono que mezcle autoridad médica con cercanía humana. Empatiza con el problema de la paciente antes de dar la solución.
        4. RITMO: Usa frases cortas, directas y con punch. Elimina el relleno académico.
        5. ESTRUCTURA: Genera exactamente entre 6 y 9 escenas que cuenten una historia o den un consejo práctico.
        6. RESALTADO: Envuelve las 1 o 2 palabras más importantes de cada frase entre asteriscos (ej: **palabra**) para resaltarlas visualmente.
        
        Responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura:
        {{
          "video_slides": [
            {{ "text": "Frase de 8 a 12 palabras exactamente" }}
          ],
          "music_suggestion": "Tipo de música específico (ej: Minimal tech rítmica, Lo-fi relajante, Cinematic inspiracional)",
          "duration_per_slide": 3,
          "total_duration": 25
        }}
        """
    else:
        prompt = f"""
        Actúa como un diseñador de Instagram experto en contenido médico y visualización de datos. 
        Crea un carrusel de 5-10 diapositivas atractivo, profesional y fácil de leer.
        
        ARTÍCULO:
        Título: {post_title}
        Contenido: {clean_text}
        
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

    # INTENTO 1: GEMINI
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = 'gemini-flash-latest' 
        model = genai.GenerativeModel(
            model_name,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        logger.info(f"Generando {generation_type} con {model_name}...")
        response = model.generate_content(prompt)
        
        if not response or not hasattr(response, 'text'):
            raise ValueError("Respuesta de Gemini inválida o bloqueada.")

        text = response.text.strip()
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(1))
            # Normalizar slides si es necesario
            if isinstance(data, dict) and 'slides' in data and isinstance(data['slides'], dict):
                data['slides'] = list(data['slides'].values())
            return data
            
        raise ValueError("No se pudo extraer JSON de Gemini.")

    except Exception as gemini_err:
        logger.warning(f"Gemini falló o alcanzó cuota: {str(gemini_err)}. Intentando Groq...")
        
        # INTENTO 2: GROQ (FALLBACK)
        try:
            return generate_with_groq(prompt)
        except Exception as groq_err:
            logger.error(f"Fallo total en ambos proveedores de IA: {str(groq_err)}")
            # Devolver el error original de Gemini si Groq también falla, 
            # o un mensaje informativo
            error_msg = str(gemini_err)
            if "429" in error_msg or "quota" in error_msg.lower():
                raise ValueError("Has alcanzado los límites de uso de Gemini y Groq. Por favor intenta más tarde.")
            raise gemini_err
