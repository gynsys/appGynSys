import sys
import os

# Ensure we can import from 'app'
sys.path.append(os.getcwd())

try:
    from app.db.base import SessionLocal
    from app.db.models.appointment import Appointment
    import json
except ImportError as e:
    print(f"Error: {e}")
    sys.exit(1)

def check_all_summaries():
    db = SessionLocal()
    try:
        # Get last 20 appointments with answers
        appts = db.query(Appointment).filter(Appointment.preconsulta_answers.isnot(None)).order_by(Appointment.created_at.desc()).limit(20).all()
        
        print("\n" + "="*100)
        print(f"SCANNING LAST {len(appts)} APPOINTMENTS FOR SUMMARIES")
        print(f"{'ID':<5} | {'Date':<12} | {'Patient':<20} | {'Gyn':<5} | {'Func':<5} | {'Habits':<7}")
        print("-" * 100)
        
        count_gyn = 0
        count_func = 0
        count_habits = 0
        
        for appt in appts:
            try:
                answers = json.loads(appt.preconsulta_answers)
                
                has_gyn = 'summary_gyn_obstetric' in answers or 'obstetric_history_summary' in answers
                has_func = 'summary_functional_exam' in answers or 'functional_exam_summary' in answers
                has_habits = 'summary_habits' in answers or 'habits_summary' in answers
                
                if has_gyn: count_gyn += 1
                if has_func: count_func += 1
                if has_habits: count_habits += 1
                
                print(f"{appt.id:<5} | {appt.created_at.strftime('%Y-%m-%d') if appt.created_at else 'N/A':<12} | {appt.patient_name[:20]:<20} | {str(has_gyn):<5} | {str(has_func):<5} | {str(has_habits):<7}")
                
                if 'ho_table_results' in answers:
                     print(f"      -> ho_table_results keys: {list(answers['ho_table_results'].keys())}")
                     print(f"      -> ho_table_results dump: {answers['ho_table_results']}")
            except:
                print(f"{appt.id:<5} | ERROR PARSING JSON")

        print("-" * 100)
        print(f"TOTAL FOUND: Gyn={count_gyn}, Functional={count_func}, Habits={count_habits}")
        print("="*100 + "\n")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_all_summaries()
