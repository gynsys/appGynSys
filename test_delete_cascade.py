
import sys
import os

# Add the backend to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db.base import SessionLocal
from app.db.models import Doctor, Appointment, TenantModule, Plan, Module
from datetime import datetime

def test_tenant_deletion_cascade():
    db = SessionLocal()
    try:
        # 1. Ensure a plan and module exist
        plan = db.query(Plan).first()
        if not plan:
            plan = Plan(name="Test Plan", price=0, description="Test")
            db.add(plan)
            db.commit()
            db.refresh(plan)
        
        module = db.query(Module).first()
        if not module:
            module = Module(name="Test Module", code="test_mod", description="Test")
            db.add(module)
            db.commit()
            db.refresh(module)

        # 2. Create a test doctor
        test_email = "delete_me@test.com"
        existing = db.query(Doctor).filter(Doctor.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()

        doctor = Doctor(
            email=test_email,
            nombre_completo="Test Deletion",
            slug_url="test-deletion",
            plan_id=plan.id,
            role="user"
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        doc_id = doctor.id
        print(f"Created test doctor with ID: {doc_id}")

        # 3. Create associated data
        appointment = Appointment(
            doctor_id=doc_id,
            patient_name="Test Patient",
            appointment_date=datetime.now()
        )
        db.add(appointment)

        tm = TenantModule(
            tenant_id=doc_id,
            module_id=module.id,
            is_enabled=True
        )
        db.add(tm)
        db.commit()
        print("Created associated appointment and tenant_module")

        # 4. Attempt deletion
        print(f"Attempting to delete doctor {doc_id}...")
        db.delete(doctor)
        db.commit()
        print("Doctor deleted successfully!")

        # 5. Verify orphans are gone
        app_count = db.query(Appointment).filter(Appointment.doctor_id == doc_id).count()
        tm_count = db.query(TenantModule).filter(TenantModule.tenant_id == doc_id).count()
        
        if app_count == 0 and tm_count == 0:
            print("Cascade verified: Orphans were removed.")
        else:
            print(f"Cascade failed: Found {app_count} appointments and {tm_count} tenant_modules.")

    except Exception as e:
        print(f"Error during deletion test: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_tenant_deletion_cascade()
