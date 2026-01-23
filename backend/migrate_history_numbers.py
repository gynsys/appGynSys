"""
Migration script to update existing consultation history numbers
from old format (HIST-timestamp) to new format (HM-YEAR-DOCTOR_ID-PATIENT_NUMBER)

Run this once after deploying the new history number system.

Usage:
    docker compose exec backend python migrate_history_numbers.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.db.models.consultation import Consultation
from sqlalchemy import extract
from datetime import datetime


def migrate_history_numbers():
    """
    Migrate all consultations to new history number format.
    
    Process:
    1. Group consultations by doctor and year
    2. For each group, assign sequential numbers per unique patient
    3. Patients with multiple consultations get the same number
    """
    db = SessionLocal()
    
    try:
        print("Starting history number migration...")
        print("=" * 60)
        
        # Get all consultations ordered by creation date
        all_consultations = db.query(Consultation).order_by(
            Consultation.doctor_id,
            Consultation.created_at
        ).all()
        
        print(f"Found {len(all_consultations)} total consultations")
        
        # Group by doctor and year
        groups = {}
        for consultation in all_consultations:
            year = consultation.created_at.year if consultation.created_at else datetime.now().year
            key = (consultation.doctor_id, year)
            
            if key not in groups:
                groups[key] = []
            groups[key].append(consultation)
        
        print(f"Grouped into {len(groups)} doctor/year combinations")
        print()
        
        total_updated = 0
        
        # Process each group
        for (doctor_id, year), consultations in groups.items():
            print(f"Processing Doctor {doctor_id}, Year {year} ({len(consultations)} consultations)")
            
            # Track patient numbers in this group
            patient_numbers = {}  # {patient_ci: sequence_number}
            next_sequence = 1
            
            for consultation in consultations:
                patient_ci = consultation.patient_ci
                
                if not patient_ci:
                    print(f"  ⚠️  Skipping consultation ID {consultation.id} (no patient CI)")
                    continue
                
                # Get or assign patient number
                if patient_ci not in patient_numbers:
                    patient_numbers[patient_ci] = next_sequence
                    next_sequence += 1
                
                patient_seq = patient_numbers[patient_ci]
                
                # Generate new history number
                new_number = f"HM-{year}-D{doctor_id:03d}-P{patient_seq:04d}"
                
                # Update if different from current
                if consultation.history_number != new_number:
                    old_number = consultation.history_number or "None"
                    consultation.history_number = new_number
                    total_updated += 1
                    print(f"  ✓ ID {consultation.id}: {old_number} → {new_number}")
            
            print()
        
        # Commit all changes
        db.commit()
        
        print("=" * 60)
        print(f"✅ Migration complete!")
        print(f"   Total consultations updated: {total_updated}")
        print(f"   Groups processed: {len(groups)}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Medical History Number Migration")
    print("=" * 60)
    print()
    
    response = input("This will update ALL existing consultation history numbers. Continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        migrate_history_numbers()
    else:
        print("Migration cancelled.")
