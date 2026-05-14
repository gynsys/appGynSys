import google.generativeai as genai
from app.core.config import settings
import logging
import json
import re
import requests
import io
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

logger = logging.getLogger(__name__)

def generate_blog_content(topic: str = None, tone: str = "Profesional", target_audience: str = "Pacientes generales", max_words: int = 500, source_text: str = None) -> dict:
    """
    Genera contenido para un artículo de blog médico usando Google Gemini 1.5 Flash.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY no está configurada.")
        raise ValueError("La funcionalidad de IA no está configurada en este momento.")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        final_context = ""
        if source_text:
            final_context = f"\n- Texto extraído del documento adjunto:\n{source_text}\n\n(IMPORTANTE: Utiliza este texto como tu fuente científica primaria para el artículo)."

        subject_line = f'Escribe un artículo de blog completo sobre el tema: "{topic}".' if topic else "Escribe un artículo de blog basado estrictamente en la información científica del documento proporcionado."

        prompt = f"""
        Actúa como un experto en redacción médica y ginecología. 
        {subject_line}
        {final_context}
        
        Parámetros obligatorios:
        - Tono: {tone}
        - Público objetivo: {target_audience}
        - Extensión del contenido: aproximadamente {max_words} palabras.
        
        Debes responder EXCLUSIVAMENTE con un objeto JSON con la siguiente estructura:
        {{
            "title": "Un título optimizado para SEO basado en el tema",
            "summary": "Un resumen de 2 líneas para el extracto del blog",
            "content": "El contenido del artículo formateado en HTML puro (usa <h2>, <h3>, <p>, <ul>, <li>, <strong>)"
        }}
        
        IMPORTANTE: 
        1. El campo "content" debe usar HTML puro, sin bloques de código ```html.
        2. No incluyas explicaciones fuera del JSON.
        3. Asegúrate de que el JSON sea válido.
        """
        
        print(f"DEBUG: Generando contenido con IA para tema: {topic} (max_words: {max_words})", flush=True)
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            print("DEBUG: Gemini devolvió una respuesta vacía o inválida.", flush=True)
            raise ValueError("No se pudo generar el contenido. La IA devolvió una respuesta vacía.")
            
        raw_text = response.text.strip()
        
        # Intentar extraer JSON si la IA lo envuelve en bloques de código
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                print(f"DEBUG: Contenido generado exitosamente. Longitud del contenido: {len(data.get('content', ''))} caracteres.", flush=True)
                return {
                    "title": data.get("title", topic),
                    "summary": data.get("summary", ""),
                    "generated_content": data.get("content", "")
                }
            except json.JSONDecodeError:
                print(f"DEBUG: Error al decodificar JSON de Gemini: {raw_text[:200]}", flush=True)
                
        # Fallback si no es JSON válido
        return {
            "title": topic,
            "summary": "",
            "generated_content": raw_text
        }
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            logger.warning(f"Cuota de IA excedida (Blog): {error_str}")
            raise ValueError("Has alcanzado el límite de uso gratuito de la IA por hoy. Por favor, intenta de nuevo mañana.")
            
        logger.error(f"Error al generar contenido con Gemini: {str(e)}", exc_info=True)
        raise ValueError(f"Error en el servicio de IA: {str(e)}")
