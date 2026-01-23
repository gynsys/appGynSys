"""
Revert user back to 'user' role and verify admin@appgynsys.com exists
"""
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:gyn13409534@localhost:5432/gynsys')

with engine.connect() as conn:
    # Revert user ID 1 back to 'user' role
    conn.execute(text("UPDATE doctors SET role = 'user' WHERE email = 'milanopabloe@gmail.com'"))
    conn.commit()
    
    print("✅ Usuario milanopabloe@gmail.com revertido a role 'user'")
    
    # Check if admin@appgynsys.com exists
    result = conn.execute(text("SELECT id, email, nombre_completo, role, is_active FROM doctors WHERE email = 'admin@appgynsys.com'"))
    admin_user = result.fetchone()
    
    if admin_user:
        print(f"\n👑 Admin del sistema encontrado:")
        print(f"   ID: {admin_user[0]}, Email: {admin_user[1]}, Nombre: {admin_user[2]}, Role: {admin_user[3]}, Active: {admin_user[4]}")
    else:
        print("\n❌ No existe el usuario admin@appgynsys.com")
        print("   Necesitamos crear este usuario para acceder al panel de administración del sistema")
    
    # Show current state of key users
    print("\n📋 Estado actual de usuarios clave:")
    result = conn.execute(text("""
        SELECT id, email, nombre_completo, role, is_active 
        FROM doctors 
        WHERE email IN ('admin@appgynsys.com', 'milanopabloe@gmail.com', 'admin@gynsys.com')
        ORDER BY id
    """))
    for row in result:
        role_icon = "👑" if row[3] == "admin" else "👤"
        status = "✅" if row[4] else "❌"
        print(f"  {role_icon} {status} ID: {row[0]}, Email: {row[1]}, Role: {row[3]}")
