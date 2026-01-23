"""
Search for admin@appgynsys.com in all doctors
"""
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:gyn13409534@localhost:5432/gynsys')

with engine.connect() as conn:
    # Search for any user with appgynsys in email
    result = conn.execute(text("""
        SELECT id, email, nombre_completo, role, is_active, slug_url
        FROM doctors 
        WHERE email LIKE '%appgynsys%' OR email LIKE '%admin%'
        ORDER BY id
    """))
    
    print("🔍 Usuarios con 'admin' o 'appgynsys' en el email:")
    rows = result.fetchall()
    if rows:
        for row in rows:
            role_icon = "👑" if row[3] == "admin" else "👤"
            status = "✅" if row[4] else "❌"
            print(f"  {role_icon} {status} ID: {row[0]}, Email: {row[1]}, Nombre: {row[2]}, Role: {row[3]}")
    else:
        print("  No se encontraron usuarios")
    
    # Also check total count
    result2 = conn.execute(text("SELECT COUNT(*) FROM doctors"))
    total = result2.fetchone()[0]
    print(f"\n📊 Total de usuarios en la base de datos: {total}")
