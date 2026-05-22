"""
CRUD operations for LLMProvider model.
API keys are encrypted with Fernet before storing and decrypted on demand.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import logging

from app.db.models.llm_provider import LLMProvider
from app.schemas.llm import LLMProviderCreate, LLMProviderUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Key encryption helpers
# ---------------------------------------------------------------------------

def _get_fernet() -> Fernet:
    """Return a Fernet instance using the app ENCRYPTION_KEY."""
    key = settings.ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt a plain API key. Returns a base64 token string."""
    return _get_fernet().encrypt(plain_key.encode()).decode()


def decrypt_api_key(enc_key: str) -> str:
    """Decrypt an encrypted API key. Raises on invalid token."""
    return _get_fernet().decrypt(enc_key.encode()).decode()


def mask_api_key(enc_key: str) -> str:
    """Return '****XXXX' where XXXX are the last 4 chars of the decrypted key."""
    try:
        plain = decrypt_api_key(enc_key)
        return f"****{plain[-4:]}" if len(plain) >= 4 else "****"
    except Exception:
        return "****"


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def get_llm_provider(db: Session, provider_id: int) -> Optional[LLMProvider]:
    return db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()


def get_llm_providers(db: Session, skip: int = 0, limit: int = 100) -> List[LLMProvider]:
    return (
        db.query(LLMProvider)
        .order_by(LLMProvider.priority.asc(), LLMProvider.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_active_providers_for_use_case(db: Session, use_case: str = "all") -> List[LLMProvider]:
    """
    Return active providers that match the given use_case, ordered by priority.
    Providers with use_case='all' match every case.
    """
    return (
        db.query(LLMProvider)
        .filter(
            LLMProvider.is_active == True,
            LLMProvider.use_case.in_([use_case, "all"])
        )
        .order_by(LLMProvider.priority.asc())
        .all()
    )


def create_llm_provider(db: Session, data: LLMProviderCreate) -> LLMProvider:
    """Create a new provider, encrypting the API key before storing."""
    enc_key = encrypt_api_key(data.api_key)
    db_obj = LLMProvider(
        provider_key=data.provider_key,
        display_name=data.display_name,
        api_key_enc=enc_key,
        model_name=data.model_name,
        base_url=data.base_url,
        is_active=data.is_active,
        priority=data.priority,
        use_case=data.use_case,
        extra_params=data.extra_params,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    logger.info(f"[LLM] Created provider '{data.display_name}' (id={db_obj.id})")
    return db_obj


def update_llm_provider(
    db: Session, provider_id: int, data: LLMProviderUpdate
) -> Optional[LLMProvider]:
    """
    Update a provider. If api_key is provided (non-empty), it is re-encrypted.
    If api_key is None or empty, the existing encrypted key is preserved.
    """
    db_obj = db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()
    if not db_obj:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Handle api_key separately to avoid overwriting with empty string
    new_plain_key: Optional[str] = update_data.pop("api_key", None)
    if new_plain_key and new_plain_key.strip():
        db_obj.api_key_enc = encrypt_api_key(new_plain_key.strip())

    for field, value in update_data.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)

    db.commit()
    db.refresh(db_obj)
    logger.info(f"[LLM] Updated provider id={provider_id}")
    return db_obj


def delete_llm_provider(db: Session, provider_id: int) -> bool:
    db_obj = db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    logger.info(f"[LLM] Deleted provider id={provider_id}")
    return True


def build_response(provider: LLMProvider) -> dict:
    """Convert a LLMProvider ORM object to a safe response dict (masked key)."""
    return {
        "id": provider.id,
        "provider_key": provider.provider_key,
        "display_name": provider.display_name,
        "api_key_masked": mask_api_key(provider.api_key_enc),
        "model_name": provider.model_name,
        "base_url": provider.base_url,
        "is_active": provider.is_active,
        "priority": provider.priority,
        "use_case": provider.use_case,
        "extra_params": provider.extra_params,
        "created_at": provider.created_at,
        "updated_at": provider.updated_at,
    }
