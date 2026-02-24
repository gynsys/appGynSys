"""
conftest.py — Fixtures compartidas para todos los tests de notificaciones.
No requiere conexión real a BD ni a la red — usa objetos mock y SimpleNamespace.

AISLAMIENTO DE INFRAESTRUCTURA:
  Los mocks en sys.modules permiten importar app.services.notifications
  sin tener psycopg2, resend, pywebpush ni requests instalados localmente.
  Los tests se ejecutan íntegramente en memoria.
"""
import sys
from unittest.mock import MagicMock

# ---------------------------------------------------------------------------
# Mockear módulos de infraestructura que no están disponibles localmente
# (psycopg2 requiere pg_config, resend/pywebpush requieren compiladores)
# En producción estos existen dentro del container Docker.
# ---------------------------------------------------------------------------
_INFRA_MOCKS = [
    # Módulos C externos que no existen localmente sin compilación
    "psycopg2",
    "psycopg2.extras",
    "pywebpush",
    "pywebpush.webpush",
    "pywebpush.WebPusher",
    # Libs de red y email
    "resend",
    "requests",
    "requests.exceptions",
    "anyio",
    "anyio.to_thread",
    # Libs de archivos/imagen
    "aiofiles",
    "qrcode",
    "Pillow",
    "PIL",
    "PIL.Image",
    # Módulos internos con dependencias de infra que no aplican a los tests
    # (mockear ANTES de que se importen las cadenas de notificaciones)
    "app.core.email",
    "app.tasks.email_tasks",
    "app.tasks",
]

for _mod_name in _INFRA_MOCKS:
    if _mod_name not in sys.modules:
        sys.modules[_mod_name] = MagicMock()

# ---------------------------------------------------------------------------
# También mockear el módulo de push_service para evitar imports de VAPID
# ---------------------------------------------------------------------------
if "app.services.push_service" not in sys.modules:
    sys.modules["app.services.push_service"] = MagicMock()

# ---------------------------------------------------------------------------
# Ahora sí los imports normales de pytest y helpers
# ---------------------------------------------------------------------------
import pytest
from types import SimpleNamespace
from datetime import date, datetime


# ---------------------------------------------------------------------------
# Fixture: contexto estándar de usuaria menstrual (día 9 del ciclo)
# ---------------------------------------------------------------------------
@pytest.fixture
def ctx_menstrual_day9() -> dict:
    """Contexto de una usuaria en día 9 del ciclo (ventana fértil próxima)."""
    return {
        "type": "menstrual",
        "cycle_day": 9,
        "is_pregnant": False,
        "phase": "follicular",
        "today": date.today(),
    }


# ---------------------------------------------------------------------------
# Fixture: contexto de usuaria embarazada (semana 28)
# ---------------------------------------------------------------------------
@pytest.fixture
def ctx_pregnant_week28() -> dict:
    """Contexto de una usuaria embarazada en semana 28 de gestación."""
    return {
        "type": "prenatal",
        "is_pregnant": True,
        "gestation_week": 28,
        "gestation_day_of_week": 1,
        "trimester": 3,
        "today": date.today(),
    }


# ---------------------------------------------------------------------------
# Fixture: contexto de usuaria con anticonceptivo activo (día 9)
# ---------------------------------------------------------------------------
@pytest.fixture
def ctx_contraceptive_active() -> dict:
    """Contexto de usuaria tomando píldora anticonceptiva activa (día 9)."""
    return {
        "type": "contraceptive",
        "subtype": "active_pill",
        "cycle_day": 9,
        "pill_number": 9,
        "is_pregnant": False,
        "today": date.today(),
    }


# ---------------------------------------------------------------------------
# Fixture: CycleNotificationSettings con permisos habilitados por defecto
# ---------------------------------------------------------------------------
@pytest.fixture
def user_settings_default():
    """Settings de notificaciones con todos los flags habilitados."""
    return SimpleNamespace(
        notifications_enabled=True,
        contraceptive_enabled=True,
        prenatal_milestones=True,
        contraceptive_time="08:00",
    )


# ---------------------------------------------------------------------------
# Fixture: CycleNotificationSettings con anticonceptivo deshabilitado
# ---------------------------------------------------------------------------
@pytest.fixture
def user_settings_no_contraceptive():
    """Settings con anticonceptivo deshabilitado."""
    return SimpleNamespace(
        notifications_enabled=True,
        contraceptive_enabled=False,
        prenatal_milestones=True,
        contraceptive_time=None,
    )


# ---------------------------------------------------------------------------
# Fixture: CycleNotificationSettings con prenatales deshabilitados
# ---------------------------------------------------------------------------
@pytest.fixture
def user_settings_no_prenatal():
    """Settings con milestones prenatales deshabilitados."""
    return SimpleNamespace(
        notifications_enabled=True,
        contraceptive_enabled=True,
        prenatal_milestones=False,
        contraceptive_time=None,
    )
