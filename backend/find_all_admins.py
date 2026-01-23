"""
Buscar TODOS los usuarios admin en la base de datos y verificar contraseñas
"""
from sqlalchemy import create_engine, text
from app.core.security import verify_password

engine = create_engine('postgresql://postgres:gyn13409534@localhost:5432/gynsys')

with engine.connect() as conn:
    # Buscar TODOS los usuarios
    result = conn.execute(text("""
        SELECT id, email, nombre_completo, role, is_active, password_hash
        FROM doctors 
        ORDER BY id
    """))
    
    print("📋 TODOS los usuarios en la base de datos:")
    print("=" * 80)
    
    for row in result:
        role_icon = "👑" if row[3] == "admin" else "👤"
        status = "✅" if row[4] else "❌"
        
        # Verificar contraseñas comunes
        password_tests = []
        if row[5]:  # Si tiene password_hash
            if verify_password("admin123", row[5]):
                password_tests.append("admin123 ✅")
            if verify_password("adminpassword", row[5]):
                password_tests.append("adminpassword ✅")
        
        password_info = ", ".join(password_tests) if password_tests else "No match"
        
        print(f"{role_icon} {status} ID: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Nombre: {row[2]}")
        print(f"   Role: {row[3]}")
        print(f"   Passwords: {password_info}")
        print("-" * 80)
