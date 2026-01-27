import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.db.models.endometriosis_result import EndometriosisResult

def check_results():
    db = SessionLocal()
    try:
        count = db.query(EndometriosisResult).count()
        print(f"Total Endometriosis Tests Found: {count}")
        
        # List them for detail
        results = db.query(EndometriosisResult).order_by(EndometriosisResult.created_at.desc()).all()
        for res in results:
            print(f"- ID: {res.id} | Score: {res.score} | Level: {res.result_level} | Date: {res.created_at}")
            
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_results()
