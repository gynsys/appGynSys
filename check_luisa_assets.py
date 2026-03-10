import sys
import os

# Get absolute path to the backend directory
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import json

from app.db.base import Base
from app.db.models.consultation import Consultation
from app.db.models.consultation_asset import ConsultationAsset
from app.db.session import engine, SessionLocal

def check_luisa_assets():
    with SessionLocal() as db:
        # Find Luisa Perez's consultations
        consultations = db.query(Consultation).filter(Consultation.patient_name.ilike('%Luisa%Perez%')).all()
        
        if not consultations:
            print("No consultation found for Luisa Perez")
            return
            
        print(f"Found {len(consultations)} consultations for Luisa Perez:")
        
        for c in consultations:
            print(f"  - Consultation ID: {c.id} | Date: {c.created_at}")
            assets = db.query(ConsultationAsset).filter(ConsultationAsset.consultation_id == c.id).all()
            if not assets:
                print(f"    -> No assets found for consultation {c.id}")
            else:
                print(f"    -> Found {len(assets)} assets for consultation {c.id}:")
                for a in assets:
                    print(f"       + ID: {a.id} | Name: {a.file_name} | Type: {a.file_type} | Path: {a.file_path}")

if __name__ == '__main__':
    check_luisa_assets()
