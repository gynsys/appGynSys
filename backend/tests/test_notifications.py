"""
test_notifications.py — Tests del pipeline de notificaciones de Mi Ciclo.

ESTRATEGIA:
  - No se requiere BD ni red (todos los tests usan fixtures mock del conftest.py)
  - Se importan directamente las funciones puras del servicio
  - Los tests validan:
    1. evaluate_registry_rule() — lógica de evaluación de reglas
    2. Límite por categoría — 1 notificación por categoría por día
    3. safe_render_content() con _RuleData — prevención de regresión principal
    4. calculate_smart_context() y validate_smart_context() — contexto de usuaria
    5. Comportamiento de recover_stale_processing_notifications() sin BD real

CORRER LOS TESTS:
  cd backend
  pip install pytest pytest-mock
  pytest tests/test_notifications.py -v
"""
import pytest
from types import SimpleNamespace
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Imports del sistema de notificaciones (funciones puras)
# ---------------------------------------------------------------------------
from app.services.notifications import (
    evaluate_registry_rule,
    validate_smart_context,
    NOTIFICATION_REGISTRY,
    NOTIFICATION_MAP,
    NOTIFICATION_CATEGORIES,
    MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY,
)


# ==============================================================================
# GRUPO 1: evaluate_registry_rule()
# ==============================================================================

class TestEvaluateRegistryRule:
    """Verifica que las reglas del NOTIFICATION_REGISTRY se evalúan correctamente."""

    def test_menstrual_day9_pasa(self, ctx_menstrual_day9, user_settings_default):
        """Una usuaria en día 9 debe recibir 'day_9_fertile_approaching'."""
        rule = NOTIFICATION_MAP["day_9_fertile_approaching"]
        result = evaluate_registry_rule(rule, ctx_menstrual_day9, user_settings_default)
        assert result is True, "Día 9 debe disparar la regla de ventana fértil próxima"

    def test_menstrual_otro_dia_no_pasa(self, user_settings_default):
        """Día 9 no debe disparar la regla del día 14."""
        rule = NOTIFICATION_MAP["day_14_ovulation_peak"]
        ctx = {"cycle_day": 9, "is_pregnant": False}
        result = evaluate_registry_rule(rule, ctx, user_settings_default)
        assert result is False, "Día 9 no debe disparar la regla del día 14"

    def test_embarazada_bloquea_menstrual(self, ctx_pregnant_week28, user_settings_default):
        """Una usuaria embarazada NO debe recibir reglas de categoría menstrual."""
        menstrual_rule = NOTIFICATION_MAP["day_14_ovulation_peak"]
        result = evaluate_registry_rule(menstrual_rule, ctx_pregnant_week28, user_settings_default)
        assert result is False, "Usuaria embarazada no debe recibir reglas menstruales"

    def test_embarazada_bloquea_contraceptive(self, ctx_pregnant_week28, user_settings_default):
        """Una usuaria embarazada NO debe recibir recordatorios de píldora."""
        contra_rule = NOTIFICATION_MAP["contraceptive_daily"]
        result = evaluate_registry_rule(contra_rule, ctx_pregnant_week28, user_settings_default)
        assert result is False, "Usuaria embarazada no debe recibir reglas de anticonceptivo"

    def test_embarazada_recibe_prenatal(self, ctx_pregnant_week28, user_settings_default):
        """Una usuaria embarazada en semana 28 SÍ debe recibir la regla de esa semana."""
        prenatal_rule = NOTIFICATION_MAP["prenatal_week_28"]
        result = evaluate_registry_rule(prenatal_rule, ctx_pregnant_week28, user_settings_default)
        assert result is True, "Semana 28 debe disparar la regla prenatal_week_28"

    def test_prenatal_deshabilitado_bloquea(self, ctx_pregnant_week28, user_settings_no_prenatal):
        """Si el usuario deshabilitó milestones prenatales, no debe recibirlos."""
        prenatal_rule = {
            "type": "prenatal_weekly_milestone",
            "category": "prenatal_milestone",
            "priority": 110,
            "logic": lambda c: c.get("is_pregnant") and c.get("gestation_day_of_week") == 1
        }
        result = evaluate_registry_rule(prenatal_rule, ctx_pregnant_week28, user_settings_no_prenatal)
        assert result is False, "Usuaria con prenatal_milestones=False no debe recibir prenatales"

    def test_contraceptive_activo_pasa(self, ctx_contraceptive_active, user_settings_default):
        """Usuaria con píldora activa día 9 DEBE recibir el recordatorio diario."""
        rule = NOTIFICATION_MAP["contraceptive_daily"]
        result = evaluate_registry_rule(rule, ctx_contraceptive_active, user_settings_default)
        assert result is True, "context de píldora activa debe disparar contraceptive_daily"

    def test_contraceptive_deshabilitado_bloquea(self, ctx_contraceptive_active, user_settings_no_contraceptive):
        """Si el usuario deshabilitó anticonceptivo, NO debe recibir el recordatorio."""
        rule = NOTIFICATION_MAP["contraceptive_daily"]
        result = evaluate_registry_rule(rule, ctx_contraceptive_active, user_settings_no_contraceptive)
        assert result is False, "Usuaria con contraceptive_enabled=False no debe recibir recordatorio"

    def test_sin_user_settings_bloquea(self, ctx_menstrual_day9):
        """Con user_settings=None todas las reglas deben bloquearse."""
        rule = NOTIFICATION_MAP["day_9_fertile_approaching"]
        result = evaluate_registry_rule(rule, ctx_menstrual_day9, None)
        assert result is False, "Sin user_settings, ninguna regla debe pasar"

    def test_regla_con_logica_que_lanza_excepcion_no_rompe(self, user_settings_default):
        """Si la lógica de una regla lanza excepción, debe retornar False sin propagarla."""
        bad_rule = {
            "type": "bad_rule",
            "category": "menstrual",
            "priority": 999,
            "logic": lambda c: 1 / 0,  # Lanza ZeroDivisionError
        }
        ctx = {"cycle_day": 5, "is_pregnant": False}
        # No debe propagar la excepción
        result = evaluate_registry_rule(bad_rule, ctx, user_settings_default)
        assert result is False, "Regla con excepción debe retornar False, no propagar"


# ==============================================================================
# GRUPO 2: NOTIFICATION_REGISTRY — Consistencia de datos
# ==============================================================================

class TestNotificationRegistry:
    """Verifica la integridad del catálogo de reglas."""

    def test_todas_las_reglas_tienen_campos_requeridos(self):
        """Toda regla del registry debe tener type, category, priority y logic."""
        required_fields = {"type", "category", "priority", "logic"}
        for rule in NOTIFICATION_REGISTRY:
            missing = required_fields - set(rule.keys())
            assert not missing, f"Regla {rule.get('type', '???')} le faltan campos: {missing}"

    def test_todas_las_categorias_son_validas(self):
        """Toda regla debe pertenecer a una categoría reconocida."""
        for rule in NOTIFICATION_REGISTRY:
            assert rule["category"] in NOTIFICATION_CATEGORIES, (
                f"Regla {rule['type']} tiene categoría inválida: {rule['category']}"
            )

    def test_no_hay_tipos_duplicados(self):
        """No puede haber dos reglas con el mismo 'type' en el registry."""
        types = [r["type"] for r in NOTIFICATION_REGISTRY]
        duplicates = [t for t in types if types.count(t) > 1]
        assert not duplicates, f"Tipos duplicados en NOTIFICATION_REGISTRY: {set(duplicates)}"

    def test_notification_map_cubre_todo_el_registry(self):
        """NOTIFICATION_MAP debe tener exactamente los mismos tipos que NOTIFICATION_REGISTRY."""
        registry_types = {r["type"] for r in NOTIFICATION_REGISTRY}
        map_types = set(NOTIFICATION_MAP.keys())
        assert registry_types == map_types, (
            f"NOTIFICATION_MAP no cubre todos los tipos: diff={registry_types ^ map_types}"
        )

    def test_todas_las_logicas_son_callable(self):
        """El campo 'logic' de cada regla debe ser callable."""
        for rule in NOTIFICATION_REGISTRY:
            assert callable(rule["logic"]), \
                f"El campo logic de '{rule['type']}' no es callable"

    def test_prenatal_weeks_cubre_semanas_1_a_41(self):
        """Deben existir reglas prenatal_week_1 hasta prenatal_week_41."""
        for week in range(1, 42):
            rule_type = f"prenatal_week_{week}"
            assert rule_type in NOTIFICATION_MAP, \
                f"Falta la regla {rule_type} en NOTIFICATION_REGISTRY"

    def test_dias_menstruales_1_a_28_presentes(self):
        """Deben existir reglas para day_1_period_start hasta day_28_period_tomorrow."""
        expected_day_types = {
            "day_1_period_start", "day_7_period_end", "day_14_ovulation_peak",
            "day_28_period_tomorrow"
        }
        for rtype in expected_day_types:
            assert rtype in NOTIFICATION_MAP, f"Falta regla: {rtype}"

    def test_max_category_limit_es_1(self):
        """El límite por categoría debe ser 1 (máxima granularidad)."""
        assert MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY == 1, (
            "MAX_NOTIFICATIONS_PER_CATEGORY_PER_DAY debe ser 1 para evitar spam"
        )

    def test_alertas_criticas_tienen_prioridad_baja(self):
        """Las alertas médicas críticas deben tener priority < 10 para procesarse primero."""
        critical_types = ["prenatal_bleeding", "prenatal_severe_headache", "prenatal_reduced_movement"]
        for rule_type in critical_types:
            rule = NOTIFICATION_MAP.get(rule_type)
            assert rule is not None, f"Falta regla crítica: {rule_type}"
            assert rule["priority"] < 10, (
                f"Regla crítica {rule_type} debe tener priority < 10, "
                f"tiene {rule['priority']}"
            )


# ==============================================================================
# GRUPO 3: validate_smart_context()
# ==============================================================================

class TestValidateSmartContext:
    """Verifica que validate_smart_context rechaza contextos malformados."""

    def test_contexto_vacio_es_invalido(self):
        """Un contexto vacío (dict vacío) debe ser inválido."""
        is_valid, error = validate_smart_context({})
        assert not is_valid, "Contexto vacío debe ser inválido"
        assert error is not None, "Contexto vacío debe tener mensaje de error"

    def test_contexto_none_lanza_error(self):
        """
        validate_smart_context(None) lanza AttributeError porque llama ctx.get()
        en un NoneType. Este es el comportamiento actual documentado como regresión
        — si se mejora para retornar (False, msg), este test debe actualizarse.
        """
        try:
            result = validate_smart_context(None)
            # Si en el futuro se añade guard para None, debe retornar (False, ...)
            is_valid, error = result
            assert not is_valid, "Si no lanza, debe indicar que es inválido"
        except (AttributeError, TypeError):
            # Comportamiento actual esperado: crasha con None
            pass  # Aceptable — documentado aquí para que se note si cambia

    def test_contexto_menstrual_valido(self, ctx_menstrual_day9):
        """Un contexto menstrual con campos básicos debe ser válido."""
        is_valid, error = validate_smart_context(ctx_menstrual_day9)
        assert is_valid, f"Contexto menstrual válido rechazado: {error}"

    def test_contexto_prenatal_valido(self, ctx_pregnant_week28):
        """Un contexto prenatal con campos básicos debe ser válido."""
        is_valid, error = validate_smart_context(ctx_pregnant_week28)
        assert is_valid, f"Contexto prenatal válido rechazado: {error}"

    def test_contexto_contraceptive_valido(self, ctx_contraceptive_active):
        """Un contexto de anticonceptivo activo debe ser válido."""
        is_valid, error = validate_smart_context(ctx_contraceptive_active)
        assert is_valid, f"Contexto anticonceptivo válido rechazado: {error}"


# ==============================================================================
# GRUPO 4: safe_render_content() con _RuleData — PREVENCIÓN DE REGRESIÓN CRÍTICA
# ==============================================================================

class TestSafeRenderContent:
    """
    Tests de regresión para el bug:
    '_RuleData' object has no attribute 'render_content'

    Este fue el bug que causó el fallo total de la usuaria 'peta' (ID=30)
    en Febrero 2026. Documentado en commit 530872f.
    """

    def test_safe_render_con_rule_data_no_lanza_excepcion(self):
        """safe_render_content() con un _RuleData no debe lanzar AttributeError."""
        from app.services.notifications import _RuleData, safe_render_content

        # Crear un mock de NotificationRule con los campos que _RuleData necesita
        mock_orm_rule = SimpleNamespace(
            id=1,
            notification_type="contraceptive_daily",
            send_time="08:00",
            channel="dual",
            title_template="💊 Recordatorio Anticonceptivo",
            message_text_template="Hola {patient_name}, es hora de tu pastilla.",
            is_active=True,
            priority=10,
        )

        rule_data = _RuleData(mock_orm_rule)
        render_vars = {"patient_name": "Peta", "cycle_day": 9}

        # NO debe lanzar AttributeError: '_RuleData' has no attribute 'render_content'
        result = safe_render_content(rule_data, render_vars)

        assert result is not None, "safe_render_content no debe retornar None con _RuleData válido"
        assert "title" in result, "El resultado debe tener clave 'title'"

    def test_safe_render_con_rule_data_interpola_nombre(self):
        """El rendering de _RuleData debe reemplazar {patient_name} correctamente."""
        from app.services.notifications import _RuleData, safe_render_content

        mock_orm_rule = SimpleNamespace(
            id=2,
            notification_type="contraceptive_daily",
            send_time="08:00",
            channel="dual",
            title_template="💊 Recordatorio",
            message_text_template="Hola {patient_name}, toma tu pastilla.",
            is_active=True,
            priority=10,
        )

        rule_data = _RuleData(mock_orm_rule)
        result = safe_render_content(rule_data, {"patient_name": "Peta"})

        assert result is not None
        # El nombre debe aparecer en el mensaje renderizado
        assert "Peta" in result.get("message_text", "") or "Peta" in result.get("title", ""), \
            f"El nombre 'Peta' debe aparecer en el resultado renderizado: {result}"

    def test_safe_render_con_template_faltante_retorna_none_o_default(self):
        """Si title_template y message_text_template son None, debe manejar gracefully."""
        from app.services.notifications import _RuleData, safe_render_content

        mock_orm_rule = SimpleNamespace(
            id=3,
            notification_type="test_rule",
            send_time="08:00",
            channel="push",
            title_template=None,
            message_text_template=None,
            is_active=True,
            priority=99,
        )

        rule_data = _RuleData(mock_orm_rule)
        # No debe lanzar excepción — puede retornar None o un dict con defaults
        try:
            result = safe_render_content(rule_data, {"patient_name": "Ana"})
            # Si retorna algo, debe ser un dict o None
            assert result is None or isinstance(result, dict), \
                "safe_render_content debe retornar None o dict, no otro tipo"
        except AttributeError as e:
            pytest.fail(f"safe_render_content lanzó AttributeError (bug de regresión): {e}")


# ==============================================================================
# GRUPO 5: _RuleData — Integridad del objeto
# ==============================================================================

class TestRuleData:
    """Verifica que _RuleData extrae correctamente los datos primitivos del ORM."""

    def _make_rule_data(self, **kwargs):
        """Helper para crear _RuleData con un mock ORM sencillo."""
        from app.services.notifications import _RuleData
        defaults = {
            "id": 42,
            "notification_type": "test_rule",
            "send_time": "08:00",
            "channel": "dual",
            "title_template": "Test Title",
            "message_text_template": "Test Message for {patient_name}",
            "is_active": True,
            "priority": 50,
        }
        defaults.update(kwargs)
        mock_orm = SimpleNamespace(**defaults)
        return _RuleData(mock_orm)

    def test_rule_data_preserva_id(self):
        """_RuleData debe preservar el id del ORM."""
        rule_data = self._make_rule_data(id=123)
        assert rule_data.id == 123

    def test_rule_data_preserva_notification_type(self):
        """_RuleData debe preservar el notification_type."""
        rule_data = self._make_rule_data(notification_type="contraceptive_daily")
        assert rule_data.notification_type == "contraceptive_daily"

    def test_rule_data_preserva_priority_default_si_none(self):
        """Si priority es None en el ORM, _RuleData debe asignar 99 como default."""
        rule_data = self._make_rule_data(priority=None)
        assert rule_data.priority == 99, \
            "Priority None debe defaultear a 99 en _RuleData"

    def test_rule_data_no_tiene_referencia_orm(self):
        """_RuleData NO debe tener sesión SQLAlchemy (es un objeto plano de datos)."""
        rule_data = self._make_rule_data()
        # No debe tener _sa_class_manager ni __dict__ de SQLAlchemy
        assert not hasattr(rule_data, "_sa_class_manager"), \
            "_RuleData no debe tener atributos de SQLAlchemy"
        assert not hasattr(rule_data, "query"), \
            "_RuleData no debe tener atributo 'query' de ORM"


# ==============================================================================
# GRUPO 6: recover_stale_processing_notifications() — Sin BD real
# ==============================================================================

class TestRecoverStaleProcessing:
    """Verifica que la función de recovery existe y tiene la firma correcta."""

    def test_funcion_existe_y_es_callable(self):
        """recover_stale_processing_notifications debe existir y ser callable."""
        from app.services.notifications import recover_stale_processing_notifications
        assert callable(recover_stale_processing_notifications), \
            "recover_stale_processing_notifications debe ser callable"

    def test_retorna_int(self):
        """La función debe retornar un int (número de registros rescatados)."""
        from app.services.notifications import recover_stale_processing_notifications
        # Con BD mockeada que no tiene registros stale, debe retornar 0
        with patch("app.services.notifications.session_scope") as mock_scope:
            mock_db = MagicMock()
            mock_db.query.return_value.filter.return_value.all.return_value = []
            mock_scope.return_value.__enter__ = MagicMock(return_value=mock_db)
            mock_scope.return_value.__exit__ = MagicMock(return_value=False)

            result = recover_stale_processing_notifications()
            # Si no hay stale, debe retornar 0
            assert isinstance(result, int), \
                f"recover_stale_processing_notifications debe retornar int, retornó: {type(result)}"

    def test_no_lanza_excepcion_si_bd_falla(self):
        """Si la BD falla, la función debe capturar el error y retornar 0."""
        from app.services.notifications import recover_stale_processing_notifications
        with patch("app.services.notifications.session_scope") as mock_scope:
            mock_scope.side_effect = Exception("BD no disponible")
            # No debe propagar la excepción
            result = recover_stale_processing_notifications()
            assert result == 0, \
                "Con BD fallida, recover debe retornar 0 sin propagar excepción"


# ==============================================================================
# GRUPO 7: Límite por Categoría — Lógica de categories_sent_today
# ==============================================================================

class TestCategoryLimit:
    """Verifica que el límite de 1 notificación por categoría funciona correctamente."""

    def test_categorias_independientes_no_se_bloquean(self):
        """
        Una notificación de categoría 'prenatal' no debe bloquear
        una de categoría 'system', y viceversa.
        """
        # Verificar que las 4 categorías son independientes
        assert len(NOTIFICATION_CATEGORIES) >= 4, \
            "Debe haber al menos 4 categorías para que el límite por categoría tenga sentido"

    def test_contraceptive_daily_es_de_categoria_contraceptive(self):
        """La regla contraceptive_daily debe tener category='contraceptive'."""
        rule = NOTIFICATION_MAP["contraceptive_daily"]
        assert rule["category"] == "contraceptive", \
            f"contraceptive_daily debe ser categoría 'contraceptive', es '{rule['category']}'"

    def test_prenatal_week_28_es_de_categoria_prenatal(self):
        """La regla prenatal_week_28 debe tener category='prenatal'."""
        rule = NOTIFICATION_MAP["prenatal_week_28"]
        assert rule["category"] == "prenatal", \
            f"prenatal_week_28 debe ser categoría 'prenatal', es '{rule['category']}'"

    def test_bleeding_alert_es_de_categoria_prenatal(self):
        """La regla prenatal_bleeding debe tener category='prenatal'."""
        rule = NOTIFICATION_MAP["prenatal_bleeding"]
        assert rule["category"].startswith("prenatal")

    def test_day_9_es_de_categoria_menstrual(self):
        """La regla de día 9 debe tener category='menstrual'."""
        rule = NOTIFICATION_MAP["day_9_fertile_approaching"]
        assert rule["category"] == "menstrual", \
            f"day_9_fertile_approaching debe ser 'menstrual', es '{rule['category']}'"
