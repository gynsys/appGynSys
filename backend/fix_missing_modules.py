
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    # Create cycle_predictor if missing
    result = conn.execute(text("SELECT id FROM modules WHERE code = 'cycle_predictor'"))
    if not result.fetchone():
        print("Creating cycle_predictor module...")
        conn.execute(text("""
            INSERT INTO modules (name, code, description, is_active, created_at)
            VALUES ('Predictor de Ciclos', 'cycle_predictor', 'Herramienta para predecir y rastrear ciclos menstruales', true, NOW())
        """))
        conn.commit()
        print("✅ cycle_predictor created!")
    else:
        print("✅ cycle_predictor already exists")
    
    # Verify recommendations exists and is active
    result = conn.execute(text("SELECT id, is_active FROM modules WHERE code = 'recommendations'"))
    row = result.fetchone()
    if row:
        print(f"✅ recommendations exists (ID: {row.id}, Active: {row.is_active})")
    else:
        print("❌ recommendations NOT FOUND - creating it...")
        conn.execute(text("""
            INSERT INTO modules (name, code, description, is_active, created_at)
            VALUES ('Recomendaciones', 'recommendations', 'Gestión de productos recomendados, afiliados y eBooks', true, NOW())
        """))
        conn.commit()
        print("✅ recommendations created!")
    
    print("\n" + "="*60)
    print("Final module list:")
    print("="*60)
    result = conn.execute(text("SELECT id, code, name, is_active FROM modules WHERE is_active = true ORDER BY id"))
    for r in result:
        print(f"  [{r.id:2d}] {r.code:25s} | {r.name}")
