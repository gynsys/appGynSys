import logging
import json
import os
import random
import pytz
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from contextlib import contextmanager
from app.core.config import settings
from app.db.base import SessionLocal

logger = logging.getLogger(__name__)

# --- Configuración Compartida ---
MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY = 1
NOTIFICATION_CATEGORIES = (
    "menstrual", 
    "rhythm",
    "prenatal", 
    "prenatal_milestone", 
    "prenatal_tip", 
    "prenatal_symptom_alert", 
    "prenatal_test", 
    "prenatal_ultrasound", 
    "contraceptive", 
    "system"
)
BATCH_SIZE_USERS = 100
BATCH_SIZE_DELIVERY = 50
MAX_RETRIES = 5
CIRCUIT_FAILURE_THRESHOLD = 5
CIRCUIT_RECOVERY_TIMEOUT = 60
STALE_PROCESSING_TIMEOUT_MINUTES = 15

# --- Utilidades de Tiempo ---
def normalize_to_caracas(dt: Optional[datetime] = None) -> datetime:
    """Garantiza datetime aware en America/Caracas."""
    tz = pytz.timezone('America/Caracas')
    if dt is None:
        return datetime.now(tz)
    if dt.tzinfo is None:
        return tz.localize(dt)
    return dt.astimezone(tz)

def calculate_next_retry_time(retry_count: int, base_delay_minutes: int = 5) -> datetime:
    """Backoff exponencial con jitter."""
    delay = base_delay_minutes * (2 ** retry_count) + random.randint(0, 5)
    return normalize_to_caracas() + timedelta(minutes=delay)

# --- Utilidades de Logging ---
def get_worker_id() -> str:
    """Identificador único del worker actual."""
    try:
        import threading as _threading
        return f"{os.getpid()}_{_threading.current_thread().ident}"
    except Exception:
        return str(os.getpid())

def log_notification_event(
    event_type: str,
    user_id: int,
    rule_type: str,
    details: Optional[dict] = None,
    level: str = "info"
) -> None:
    """Logging estructurado en JSON."""
    try:
        payload = {
            "event": event_type,
            "user_id": user_id,
            "rule_type": rule_type,
            "timestamp": datetime.utcnow().isoformat(),
            "worker_id": get_worker_id(),
        }
        if details:
            payload.update(details)

        msg = json.dumps(payload, default=str)
        log_fn = getattr(logger, level, logger.info)
        log_fn(msg)
    except Exception as _log_ex:
        logger.warning(f"log_notification_event failed silently: {_log_ex}")

# --- Circuit Breaker ---
class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold=CIRCUIT_FAILURE_THRESHOLD, recovery_timeout=CIRCUIT_RECOVERY_TIMEOUT):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._reset()

    def _reset(self):
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if self.last_failure_time and (datetime.now() - self.last_failure_time).seconds > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering HALF_OPEN state")
                return True
            return False
        return True

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self._reset()
            logger.info("Circuit breaker CLOSED (recovered)")
        else:
            self.failure_count = max(0, self.failure_count - 1)

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            if self.state != CircuitState.OPEN:
                logger.warning(f"Circuit breaker OPEN after {self.failure_count} failures")
            self.state = CircuitState.OPEN

push_circuit = CircuitBreaker()

# --- Database Scope ---
@contextmanager
def session_scope():
    """Context manager para sesiones de DB."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
