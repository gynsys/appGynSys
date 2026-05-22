"""
AI Service for GynSys blog content generation.
Delegates to llm_router for provider selection, fallback, and caching.
"""
import logging
import json
import re
import requests

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

from app.services.llm_router import call_llm_json

logger = logging.getLogger(__name__)


def generate_blog_content(
    topic: str = None,
    tone: str = "Profesional",
    target_audience: str = "Pacientes generales",
    max_words: int = 500,
    source_text: str = None,
) -> dict:
    """
    Genera contenido para un artículo de blog médico.
    Usa el router de LLM configurado en /admin/llm-providers.
    """
    final_context = ""
    if source_text:
        final_context = (
            f"\n- Texto extraído del documento adjunto:\n{source_text}\n\n"
            "(IMPORTANTE: Utiliza este texto como tu fuente científica primaria para el artículo)."
        )

    subject_line = (
        f'Escribe un artículo de blog completo sobre el tema: "{topic}".'
        if topic
        else "Escribe un artículo de blog basado estrictamente en la información científica del documento proporcionado."
    )

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

    logger.info(f"[ai_service] Generando contenido blog para tema: '{topic}' (max_words: {max_words})")

    try:
        data = call_llm_json(prompt, use_case="blog")
        return {
            "title": data.get("title", topic),
            "summary": data.get("summary", ""),
            "generated_content": data.get("content", ""),
        }
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            logger.warning(f"[ai_service] Cuota de IA excedida: {error_str}")
            raise ValueError(
                "Has alcanzado el límite de uso de la IA por hoy. "
                "El administrador puede configurar un proveedor alternativo en /admin/llm-providers."
            )
        logger.error(f"[ai_service] Error al generar contenido: {error_str}", exc_info=True)
        raise ValueError(f"Error en el servicio de IA: {error_str}")
