from datetime import date
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import PregnancyLog, SymptomLog
from .base import logger, normalize_to_caracas

def calculate_smart_context(user: CycleUser, predictions: Optional[dict], pregnancy: Optional[PregnancyLog], db_session: Session) -> dict:
    """Construye un objeto de contexto completo describiendo el estado actual de la usuaria."""
    today = normalize_to_caracas().date()
    ctx = {"today": today, "is_pregnant": False}

    # 1. Síntomas universales
    try:
        symptom_log = db_session.query(SymptomLog).filter(
            SymptomLog.cycle_user_id == user.id,
            SymptomLog.date == today
        ).first()
        if symptom_log and symptom_log.symptoms:
            if isinstance(symptom_log.symptoms, list):
                ctx["reported_symptoms"] = symptom_log.symptoms
            elif isinstance(symptom_log.symptoms, str):
                ctx["reported_symptoms"] = [symptom_log.symptoms]
    except Exception as e:
        logger.warning(f"Error cargando síntomas para user {user.id}: {e}")

    # 2. Contexto de embarazo
    if pregnancy and pregnancy.is_active:
        ctx["is_pregnant"] = True
        try:
            gestation_days = (today - pregnancy.last_period_date).days
            ctx["gestation_days"] = max(0, gestation_days)
            ctx["gestation_week"] = ctx["gestation_days"] // 7
            ctx["gestation_day_of_week"] = (ctx["gestation_days"] % 7) + 1
            if ctx["gestation_week"] < 14:
                ctx["trimester"] = 1
            elif ctx["gestation_week"] < 28:
                ctx["trimester"] = 2
            else:
                ctx["trimester"] = 3
        except Exception as e:
            logger.error(f"Error calculando gestación para user {user.id}: {e}")
        return ctx

    # 3. Contexto de ciclo menstrual
    if predictions and isinstance(predictions, dict):
        ctx["cycle_day"] = predictions.get("cycle_day", 0)
        ctx["is_ovulation_day"] = (today == predictions.get("ovulation_date"))
        ctx["is_fertile_start"] = (today == predictions.get("fertile_window_start"))
        ctx["is_fertile_end"] = (today == predictions.get("fertile_window_end"))
        
        if predictions.get("ovulation_date"):
            ctx["days_after_ovulation"] = (today - predictions["ovulation_date"]).days
            
        if predictions.get("next_period_start"):
            ctx["days_before_period"] = (predictions["next_period_start"] - today).days
            days_late = (today - predictions["next_period_start"]).days
            if days_late > 0:
                ctx["period_confirmation_needed"] = True
                ctx["days_late"] = days_late
                
        if "period_length" in predictions:
            days_after = ctx["cycle_day"] - predictions["period_length"]
            if days_after > 0:
                ctx["days_after_period"] = days_after
                
        ctx["phase"] = predictions.get("phase")

    # 4. Contexto anticonceptivo
    cycle_day = ctx.get("cycle_day", 0)
    if cycle_day > 0:
        ctx["type"] = "contraceptive"
        ctx["pill_number"] = cycle_day
        if cycle_day <= 21:
            ctx["subtype"] = "active_pill"
            ctx["pill_subtype"] = "active_pill"
        elif cycle_day <= 28:
            ctx["subtype"] = "placebo"
            ctx["pill_subtype"] = "placebo"
        if cycle_day == 1:
            ctx["pill_event"] = "new_pack"

    # 5. Chequeo anual
    if user.created_at:
        try:
            user_created_date = user.created_at.date()
            if user_created_date.month == today.month and user_created_date.day == today.day:
                ctx["is_annual_checkup"] = True
        except Exception:
            pass

    return ctx

def validate_smart_context(ctx: dict) -> Tuple[bool, Optional[str]]:
    """Valida que el contexto tenga los campos mínimos necesarios."""
    if not ctx or not ctx.get("today"):
        return False, "Missing today"
    if ctx.get("is_pregnant"):
        if not ctx.get("gestation_week") and not ctx.get("gestation_days"):
            return False, "Pregnant but no gestation info"
    return True, None
