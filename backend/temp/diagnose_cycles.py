
import sys
import os
from datetime import date, timedelta

# Setup path
sys.path.append('/opt/appgynsys/backend')

from app.db.base import SessionLocal
from app.db.models.cycle_user import CycleUser
from app.db.models.cycle_predictor import CycleLog
from app.cycle_predictor.logic import calculate_predictions 

def diagnose():
    db = SessionLocal()
    try:
        print("\n=== DIAGNÓSTICO DE CICLO: LOURDES ===")
        email = "marilouh.mh@gmail.com"
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
        
        if not user:
            print(f"Usuario {email} no encontrado.")
            return

        print(f"Configuración: Ciclo={user.cycle_avg_length} días, Periodo={user.period_avg_length} días")

        # Get last 3 cycles
        cycles = db.query(CycleLog).filter(CycleLog.cycle_user_id == user.id)\
            .order_by(CycleLog.start_date.desc()).limit(3).all()

        print("\n--- HISTORIAL RECIENTE (DB) ---")
        if not cycles:
            print("No hay registros de ciclos.")
            return

        for i, c in enumerate(cycles):
            print(f"Ciclo -{i}: Inicio={c.start_date}, Fin={c.end_date if c.end_date else 'Activo'}")

        last_cycle = cycles[0]
        today = date.today()
        cycle_day = (today - last_cycle.start_date).days + 1
        
        print(f"\n--- ESTADO ACTUAL (Calculado) ---")
        print(f"Fecha Hoy: {today}")
        print(f"Última Regla Registrada: {last_cycle.start_date}")
        print(f"Día del Ciclo: {cycle_day}")
        
        if cycle_day <= 5:
            print(f"Estado: MENSTRUACIÓN (Días 1-5)")
        elif 10 <= cycle_day <= 16:
            print(f"Estado: VENTANA FÉRTIL (Calculada)")
        else:
            print(f"Estado: FASE FOLICULAR o LÚTEA (No fértil)")

        print(f"\n--- PREDICCIÓN SISTEMA ---")
        preds = calculate_predictions(last_cycle.start_date, user.cycle_avg_length, user.period_avg_length)
        print(f"Inicio Ventana Fértil: {preds['fertile_window_start']}")
        print(f"Ovulación: {preds['ovulation_date']}")
        
        print("\n--- CONCLUSIÓN ---")
        if cycle_day < 10:
             print(f"El sistema cree que la usuaria está en el día {cycle_day} (Menstruación/Post-menstruación).")
             print("Por eso NO envía notificaciones fértiles hoy.")
             print("Si la usuaria ESTÁ fértil hoy, la fecha de última regla (Last Period) es INCORRECTA en la BD.")
        else:
             print(f"El sistema coincide con días fértiles.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
