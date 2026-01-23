
from sqlalchemy import create_engine, text

# Docker DB connection  
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    # Get Mariel's ID and module ID
    result = conn.execute(text("SELECT id FROM doctors WHERE slug_url = 'mariel-herrera'"))
    mariel_id = result.fetchone()[0]
    print(f"✅ Mariel Herrera ID: {mariel_id}")
    
    result = conn.execute(text("SELECT id FROM modules WHERE code = 'recommendations'"))
    rec_module_id = result.fetchone()[0]
    print(f"✅ Recommendations Module ID: {rec_module_id}")
    
    # Check if already exists
    result = conn.execute(text("""
        SELECT is_enabled FROM tenant_modules 
        WHERE tenant_id = :tenant_id AND module_id = :module_id
    """), {"tenant_id": mariel_id, "module_id": rec_module_id})
    
    existing = result.fetchone()
    
    if existing:
        if existing[0]:
            print(f"✅ Module already enabled!")
        else:
            # Enable it
            conn.execute(text("""
                UPDATE tenant_modules 
                SET is_enabled = true 
                WHERE tenant_id = :tenant_id AND module_id = :module_id
            """), {"tenant_id": mariel_id, "module_id": rec_module_id})
            conn.commit()
            print("✅ Module enabled (was disabled)!")
    else:
        # Insert new relationship
        conn.execute(text("""
            INSERT INTO tenant_modules (tenant_id, module_id, is_enabled, created_at)
            VALUES (:tenant_id, :module_id, true, NOW())
        """), {"tenant_id": mariel_id, "module_id": rec_module_id})
        conn.commit()
        print("✅ Module activated for Mariel!")
    
    # Verify
    print("\n📋 All modules for Mariel Herrera:")
    result = conn.execute(text("""
        SELECT m.code, tm.is_enabled
        FROM tenant_modules tm
        JOIN modules m ON m.id = tm.module_id
        WHERE tm.tenant_id = :tenant_id
        ORDER BY m.code
    """), {"tenant_id": mariel_id})
    
    for row in result:
        status = "✅" if row.is_enabled else "❌"
        print(f"  {status} {row.code}")
