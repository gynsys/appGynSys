"""
Script to make a user an admin
"""
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:gyn13409534@localhost:5432/gynsys')

with engine.connect() as conn:
    # Update user ID 1 to be admin
    conn.execute(text("UPDATE doctors SET role = 'admin' WHERE id = 1"))
    conn.commit()
    
    print("✅ Usuario ID 1 (milanopabloe@gmail.com) ahora es ADMIN")
    
    # Verify
    result = conn.execute(text("SELECT id, email, nombre_completo, role FROM doctors WHERE id = 1"))
    for row in result:
        print(f"\n👑 ID: {row[0]}, Email: {row[1]}, Nombre: {row[2]}, Role: {row[3]}")
