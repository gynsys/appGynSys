import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.notification import NotificationRule, NotificationType, NotificationChannel

def seed_rules():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        print(f"Checking {len(doctors)} doctors...")
        
        default_rules = [
            {
                "name": "Día de Ovulación",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_ovulation_day": True},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>Día de Ovulación</h1><p>Hola {patient_name}, hoy es tu día de ovulación. Es tu pico máximo de fertilidad.</p>"
            },
            {
                "name": "Recordatorio de Periodo (Mañana)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_before_period": 1},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>Tu periodo llega pronto</h1><p>Hola {patient_name}, según tus predicciones, tu periodo debería comenzar mañana.</p>"
            },
            {
                "name": "Inicio Ventana Fértil",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_fertile_start": True},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>Ventana Fértil</h1><p>Hola {patient_name}, hoy comienza tu ventana fértil. Tienes probabilidad de embarazo.</p>"
            }
        ]
        
        count = 0
        for doctor in doctors:
            # Check if doctor has rules
            existing = db.query(NotificationRule).filter(NotificationRule.tenant_id == doctor.id).first()
            if existing:
                print(f"Doctor {doctor.slug_url} already has rules. Skipping.")
                continue
            
            print(f"Seeding rules for {doctor.slug_url}...")
            for dr in default_rules:
                rule = NotificationRule(
                    tenant_id=doctor.id,
                    name=dr["name"],
                    notification_type=dr["type"],
                    trigger_condition=dr["trigger"],
                    channel=dr["channel"],
                    message_template=dr["template"],
                    is_active=True
                )
                db.add(rule)
            count += 1
            
        db.commit()
        print(f"Seeded rules for {count} new doctors.")
        
    except Exception as e:
        print(f"Error seeding rules: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_rules()
