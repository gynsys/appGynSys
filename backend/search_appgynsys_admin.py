"""
Buscar admin@appgynsys.com sin importar módulos de la app
"""
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:gyn13409534@localhost:5432/gynsys')

with engine.connect() as conn:
    # Buscar específicamente admin@appgynsys.com
    result = conn.execute(text("""
        SELECT id, email, nombre_completo, role, is_active
        FROM doctors 
        WHERE email = 'admin@appgynsys.com'
    """))
    
    row = result.fetchone()
    
    if row:
        print("✅ Encontrado admin@appgynsys.com:")
        print(f"   ID: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Nombre: {row[2]}")
        print(f"   Role: {row[3]}")
        print(f"   Active: {row[4]}")
    else:
        print("❌ NO se encontró admin@appgynsys.com en la base de datos")
        print("\n🔍 Usuarios que SÍ existen con 'admin' en el email:")
        
        result2 = conn.execute(text("""
            SELECT id, email, nombre_completo, role
            FROM doctors 
            WHERE email LIKE '%admin%'
            ORDER BY id
        """))
        
        for r in result2:
            print(f"   - ID: {r[0]}, Email: {r[1]}, Role: {r[3]}")
