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
        
        # 1. Smart Cycle Rules (Daily Logic)
        cycle_rules = [
            # --- Menstrual Phase (Days 1-5) ---
            {
                "name": "Día 1 - Inicio Periodo",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 1},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🩸 Inicio de Ciclo</h1><p>Hola {patient_name}, hoy está marcado como el inicio de tu periodo. <strong>¿Llegó puntualmente?</strong><br>Confirma en la app y registra qué tan abundante es.</p>"
            },
            {
                "name": "Día 2 - Chequeo de Dolor",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 2},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>💆‍♀️ Día 2</h1><p>¿Tienes cólicos? Registra tu nivel de dolor (1-10) hoy para mejorar tus predicciones.</p>"
            },
            {
                "name": "Día 5 - Fin de Periodo",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 5},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>🌤️ Fin de Periodo</h1><p>Tu periodo debería terminar hoy. ¿Sigues manchando? Registra tus últimos síntomas.<br><em>Tip de tu Dr: Estos datos son clave para tu historial.</em></p>"
            },

            # --- Follicular / Safe Days (Days 6-9) ---
            {
                "name": "Día 7 - Fase Folicular (Seguro)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 7},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>🛡️ Día Seguro</h1><p>Estás en tu fase folicular. Riesgo de embarazo bajo. Tu energía empieza a subir. ⚡</p>"
            },
            {
                "name": "Día 9 - Alerta Pre-Fértil",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 9},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>⚠️ Atención</h1><p>Mañana inicia tu ventana fértil. Si no buscas embarazo, empieza a tomar precauciones extra.</p>"
            },

            # --- Fertile Window (Days 10-15) ---
            {
                "name": "Día 10 - Inicio Ventana Fértil",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_fertile_start": True}, # Or cycle_day 10 fallback
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🚨 Ventana Fértil Activa</h1><p>Desde hoy tus probabilidades de embarazo son altas. Usa protección.</p>"
            },
            {
                "name": "Día 14 - Ovulación (Pico)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"is_ovulation_day": True},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🥚 DÍA PICO DE FERTILIDAD</h1><p>Hoy es tu día de ovulación estimado. Máximo riesgo (o máxima oportunidad). 🎯</p>"
            },
            {
                "name": "Día 15 - Fin Ventana Fértil",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_after_ovulation": 1},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>📉 Fin Ventana Fértil</h1><p>Tu ventana de riesgo termina hoy. Entrando en fase lútea.</p>"
            },

            # --- Luteal Phase / Engagement (Days 16-28) ---
            {
                "name": "Día 17 - Fase Lútea (Tip SaaS)",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"cycle_day": 17},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>🛡️ Fase Lútea</h1><p>Días seguros. Recuerda que puedes <strong>imprimir tu reporte de ciclo</strong> para tu próxima cita médica. 🖨️</p>"
            },
            {
                "name": "Día 20 - Engagement Viral",
                "type": NotificationType.SYSTEM,
                "trigger": {"cycle_day": 20},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>💌 ¿Te gusta Mi Ciclo?</h1><p>Ayuda a tus amigas a cuidar su salud. ¡Recomiéndales la app!</p>"
            },
            {
                "name": "Día 23 - Chequeo SPM",
                "type": NotificationType.SYMPTOM_ALERT,
                "trigger": {"cycle_day": 23},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>🌪️ ¿Síntomas de SPM?</h1><p>¿Te sientes hinchada o irritable? Regístralo hoy para que entendamos mejor tu ciclo.</p>"
            },
            {
                "name": "Día 27 - Pre-Aviso Periodo",
                "type": NotificationType.CYCLE_PHASE,
                "trigger": {"days_before_period": 1},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>📅 Mañana llega tu periodo</h1><p>Prepara tus productos de higiene. ¿Novedades o dolores previos? Regístralos.</p>"
            }
        ]

        # 2. Contraceptive Rules (Pill Logic)
        pill_rules = [
            {
                "name": "Recordatorio Píldora (Activa)",
                "type": NotificationType.CUSTOM,
                "trigger": {"type": "contraceptive", "subtype": "active_pill"},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>💊 Hora de tu Píldora</h1><p>Toma tu pastilla #{pill_number}. ¡Mantén tu protección al 100%!</p>"
            },
            {
                "name": "Inicio Nueva Caja Píldoras",
                "type": NotificationType.CUSTOM,
                "trigger": {"type": "contraceptive", "subtype": "new_pack"},
                "channel": NotificationChannel.DUAL,
                "template": "<h1>🆕 Nueva Caja</h1><p>Hoy inicias un nuevo blíster. Es vital que no olvides esta primera toma.</p>"
            },
            {
                "name": "Día de Descanso (Placebo)",
                "type": NotificationType.CUSTOM,
                "trigger": {"type": "contraceptive", "subtype": "placebo"},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>😴 Día de Descanso</h1><p>Hoy no tomas pastilla activa (o tomas placebo). Disfruta tu semana de descanso.</p>"
            }
        ]
        
        # 3. Period Confirmation Logic (The "Loop")
        confirmation_rules = [
             {
                "name": "Confirmación Periodo Tardío (Día 1)",
                "type": NotificationType.SYSTEM,
                "trigger": {"event": "period_confirmation", "day_late": 1},
                "channel": NotificationChannel.PUSH,
                "template": "<h1>🩸 ¿Llegó tu periodo?</h1><p>Ayer lo esperábamos. Entra a la app y confirma si ya inició para ajustar tu calendario.</p>"
            },
             {
                "name": "Confirmación Periodo Tardío (Día 3)",
                "type": NotificationType.SYSTEM,
                "trigger": {"event": "period_confirmation", "day_late": 3},
                "channel": NotificationChannel.EMAIL,
                "template": "<h1>📅 Seguimiento de Ciclo</h1><p>Llevas 3 días de retraso según nuestras cuentas. ¿Todo bien? Confirma tu estado.</p>"
            }
        ]
        
        # 4. Prenatal Rules (Restored)
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
        
        # 5. System Rules (Restored)
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
        
        all_rules = cycle_rules + pill_rules + confirmation_rules + prenatal_rules + system_rules
        
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
