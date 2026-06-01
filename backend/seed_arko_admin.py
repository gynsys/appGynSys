from app.db.session import SessionLocal
from app.db.models.arko import ArkoAdmin
from app.api.v1.endpoints.arko import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(ArkoAdmin).filter(ArkoAdmin.email == "admin@arko360.com").first()
        if not existing_admin:
            new_admin = ArkoAdmin(
                email="admin@arko360.com",
                hashed_password=get_password_hash("Arko360.admin"),
                full_name="Administrador Arko 360",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("Arko admin created successfully (admin@arko360.com / Arko360.admin)")
        else:
            print("Arko admin already exists.")
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
