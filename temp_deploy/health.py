from datetime import timedelta
from sqlalchemy.orm import Session
from app.db.models.notification import PendingNotification, NotificationLog
from .base import logger, normalize_to_caracas, push_circuit

def get_notification_system_health(db: Session) -> dict:
    """Devuelve métricas de salud del sistema de notificaciones."""
    try:
        now = normalize_to_caracas()
        yesterday = now - timedelta(days=1)
        
        pending_count = db.query(PendingNotification).filter(PendingNotification.status == "pending").count()
        failed_count = db.query(PendingNotification).filter(PendingNotification.status == "failed").count()
        retrying_count = db.query(PendingNotification).filter(PendingNotification.status == "retrying").count()
        processing_count = db.query(PendingNotification).filter(PendingNotification.status == "processing").count()
        
        sent_last_24h = db.query(NotificationLog).filter(NotificationLog.sent_at >= yesterday).count()
        failed_last_24h = db.query(PendingNotification).filter(
            PendingNotification.status == "failed",
            PendingNotification.updated_at >= yesterday
        ).count()
        
        # Determinar estado
        status = "healthy"
        if failed_count > 100 or failed_last_24h > 50:
            status = "degraded"
        if failed_count > 500 or failed_last_24h > 200:
            status = "critical"
        
        return {
            "status": status,
            "pending_queue": pending_count,
            "processing": processing_count,
            "failed_total": failed_count,
            "retrying": retrying_count,
            "sent_last_24h": sent_last_24h,
            "failed_last_24h": failed_last_24h,
            "circuit_breaker": {
                "state": push_circuit.state.value,
                "failures": push_circuit.failure_count,
                "threshold": push_circuit.failure_threshold
            },
            "timestamp": now.isoformat()
        }
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": normalize_to_caracas().isoformat()}
