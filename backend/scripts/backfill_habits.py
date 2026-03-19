
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
from datetime import datetime

DATABASE_URL = "postgresql://postgres:GynsysDB2026!Secure@db:5432/gynsys"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def backfill_habits():
    db = SessionLocal()
    try:
        # Get all consultations
        query_conss = text("SELECT id, patient_ci, created_at, habits_summary FROM consultations")
        conss = db.execute(query_conss).fetchall()
        
        print(f"Found {len(conss)} consultations to evaluate.")
        
        updated_count = 0
        for cons_id, ci, created_at, current_summary in conss:
            if not ci:
                continue
                
            # Find the most recent COMPLETED appointment for this CI created before or near the consultation
            query_app = text("""
                SELECT preconsulta_answers FROM appointments 
                WHERE patient_dni = :ci 
                AND status = 'completed'
                AND created_at <= :created_at + interval '1 day'
                ORDER BY created_at DESC LIMIT 1
            """)
            app = db.execute(query_app, {"ci": ci, "created_at": created_at}).fetchone()
            
            if not app or not app[0]:
                continue
                
            answers = app[0]
            if isinstance(answers, str):
                try:
                    answers = json.loads(answers)
                except:
                    continue
            
            # Extract habits
            smoking = answers.get('habits_smoking', answers.get('15'))
            alcohol = answers.get('habits_alcohol', answers.get('16'))
            activity = answers.get('habits_physical_activity', answers.get('17'))
            substances = answers.get('habits_substance_use', answers.get('18'))
            
            # If all are None, skip
            if all(v is None for v in [smoking, alcohol, activity, substances]):
                continue
                
            # Update consultation
            update_query = text("""
                UPDATE consultations 
                SET habits_smoking = :smoking,
                    habits_alcohol = :alcohol,
                    habits_physical_activity = :activity,
                    habits_substance_use = :substances
                WHERE id = :id
            """)
            
            db.execute(update_query, {
                'smoking': smoking if smoking is not None else 'No reportado',
                'alcohol': alcohol if alcohol is not None else 'No reportado',
                'activity': activity if activity is not None else 'No reportado',
                'substances': substances if substances is not None else 'No reportado',
                'id': cons_id
            })
            updated_count += 1
            if updated_count % 10 == 0:
                print(f"Updated {updated_count} consultations so far...")
                
        db.commit()
        print(f"Backfill completed. Total updated: {updated_count}")
        
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_habits()
