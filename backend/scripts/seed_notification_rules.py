"""
Seed default notification rules for all doctors
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models.doctor import Doctor
from app.db.models.notification import NotificationRule, NotificationType, NotificationChannel

def seed_default_rules():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        print(f"Seeding notification rules for {len(doctors)} doctors...")
        
        # Default rules for Menstrual Cycle Calculator
        cycle_rules = [
            {
                "name": "Día de Ovulación",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_ovulation_day": True},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🥚 Día de Ovulación</h1><p>Hola {patient_name}, hoy es tu día de ovulación. Es tu pico máximo de fertilidad.</p>"
            },
            {
                "name": "Inicio Ventana Fértil",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_fertile_start": True},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>💚 Ventana Fértil</h1><p>Hola {patient_name}, hoy comienza tu ventana fértil. Tienes alta probabilidad de embarazo.</p>"
            },
            {
                "name": "Recordatorio de Período (1 día antes)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_before_period": 1},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>📅 Tu período llega pronto</h1><p>Hola {patient_name}, según tus predicciones, tu período debería comenzar mañana.</p>"
            },
            {
                "name": "Recordatorio de Período (3 días antes)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_before_period": 3},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>📅 Recordatorio</h1><p>Hola {patient_name}, tu período debería comenzar en aproximadamente 3 días.</p>"
            },
            {
                "name": "Fase Folicular",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 7},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>🌱 Fase Folicular</h1><p>Hola {patient_name}, estás en la fase folicular de tu ciclo.</p>"
            },
            {
                "name": "Fase Lútea",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_after_ovulation": 3},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>🌙 Fase Lútea</h1><p>Hola {patient_name}, estás en la fase lútea de tu ciclo.</p>"
            },
        ]
        
        # Default rules for Prenatal
        prenatal_rules = [
            {
                "name": "Semana 12 - Primer Trimestre Completo",
                "type": NotificationType.PRENATAL_MILESTONE,
                "trigger": {"gestation_week": 12},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🎉 ¡Felicitaciones!</h1><p>Hola {patient_name}, has completado el primer trimestre. ¡Es un gran hito!</p>"
            },
            {
                "name": "Semana 20 - Mitad del Embarazo",
                "type": NotificationType.PRENATAL_MILESTONE,
                "trigger": {"gestation_week": 20},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🎊 ¡A mitad de camino!</h1><p>Hola {patient_name}, estás en la semana 20, ¡la mitad del embarazo!</p>"
            },
            {
                "name": "Semana 28 - Tercer Trimestre",
                "type": NotificationType.PRENATAL_MILESTONE,
                "trigger": {"gestation_week": 28},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🌟 Tercer Trimestre</h1><p>Hola {patient_name}, has entrado en el tercer y último trimestre.</p>"
            },
            {
                "name": "Semana 36 - Preparación para el Parto",
                "type": NotificationType.PRENATAL_MILESTONE,
                "trigger": {"gestation_week": 36},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>👶 Muy Pronto</h1><p>Hola {patient_name}, estás en la semana 36. ¡Tu bebé llegará pronto!</p>"
            },
        ]
        
        # System rules
        system_rules = [
            {
                "name": "Bienvenida al Sistema",
                "type": NotificationType.SYSTEM,
                "trigger": {"event": "user_registered"},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>👋 Bienvenida a GynSys</h1><p>Hola {patient_name}, gracias por registrarte en nuestro sistema de seguimiento ginecológico.</p>"
            },
            {
                "name": "Completar Perfil",
                "type": NotificationType.SYSTEM,
                "trigger": {"days_after_registration": 3, "profile_incomplete": True},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>📝 Completa tu Perfil</h1><p>Hola {patient_name}, completa tu perfil para aprovechar al máximo el sistema.</p>"
            },
        ]
        
        all_rules = cycle_rules + prenatal_rules + system_rules
        
        count = 0
        for doctor in doctors:
            # Check if doctor already has rules
            existing = db.query(NotificationRule).filter(
                NotificationRule.tenant_id == doctor.id
            ).first()
            
            if existing:
                print(f"  Doctor {doctor.slug_url} already has rules. Skipping.")
                continue
            
            print(f"  Seeding {len(all_rules)} rules for {doctor.slug_url}...")
            for rule_def in all_rules:
                rule = NotificationRule(
                    tenant_id=doctor.id,
                    name=rule_def["name"],
                    notification_type=rule_def["type"],
                    trigger_condition=rule_def["trigger"],
                    channel=rule_def["channel"],
                    message_template=rule_def["template"],
                    is_active=True
                )
                db.add(rule)
            count += 1
            
        db.commit()
        print(f"\n✅ Seeded notification rules for {count} new doctors.")
        print(f"Total rules per doctor: {len(all_rules)}")
        print(f"  - Calculadora Menstrual: {len(cycle_rules)}")
        print(f"  - Prenatal: {len(prenatal_rules)}")
        print(f"  - Sistema: {len(system_rules)}")
        
    except Exception as e:
        print(f"❌ Error seeding rules: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_default_rules()
