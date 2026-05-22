"""
Seed script: Bootstrap LLM providers from .env variables into the database.

Run ONCE after the first deployment of the llm_providers feature:
    docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python app/seeds/seed_llm_providers.py

The script is idempotent: if providers already exist in DB, it does nothing.
"""
import sys
import os
import logging

# Ensure app package is importable when running directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.base import SessionLocal
from app.db.models.llm_provider import LLMProvider
from app.crud.llm import encrypt_api_key
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_seed() -> None:
    db = SessionLocal()
    try:
        existing_count = db.query(LLMProvider).count()
        if existing_count > 0:
            logger.info(
                f"[seed_llm] Table already has {existing_count} provider(s). Skipping seed."
            )
            return

        providers_to_seed = []

        # --- Gemini (Primary) ---
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key:
            providers_to_seed.append(
                LLMProvider(
                    provider_key="gemini",
                    display_name="Google Gemini Flash",
                    api_key_enc=encrypt_api_key(gemini_key),
                    model_name="gemini-flash-latest",
                    base_url=None,
                    is_active=True,
                    priority=1,
                    use_case="all",
                    extra_params=None,
                )
            )
            logger.info("[seed_llm] Prepared Gemini provider (priority=1).")
        else:
            logger.warning("[seed_llm] GEMINI_API_KEY not found in .env — skipping Gemini.")

        # --- Groq / Llama (Fallback) ---
        groq_key = settings.GROQ_API_KEY
        if groq_key:
            providers_to_seed.append(
                LLMProvider(
                    provider_key="groq",
                    display_name="Groq Llama 3.3 70B",
                    api_key_enc=encrypt_api_key(groq_key),
                    model_name="llama-3.3-70b-versatile",
                    base_url="https://api.groq.com/openai/v1",
                    is_active=True,
                    priority=2,
                    use_case="all",
                    extra_params={"temperature": 0.7, "max_tokens": 2048},
                )
            )
            logger.info("[seed_llm] Prepared Groq provider (priority=2, fallback).")
        else:
            logger.warning("[seed_llm] GROQ_API_KEY not found in .env — skipping Groq.")

        if not providers_to_seed:
            logger.error(
                "[seed_llm] No API keys found in .env. "
                "Add GEMINI_API_KEY and/or GROQ_API_KEY before running the seed."
            )
            return

        db.bulk_save_objects(providers_to_seed)
        db.commit()
        logger.info(f"[seed_llm] ✅ Seeded {len(providers_to_seed)} provider(s) successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"[seed_llm] Error during seed: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
