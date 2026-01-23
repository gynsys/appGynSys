
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:gyn13409534@localhost:5432/gynsys"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    print("="*80)
    print("MODULES vs TENANT_MODULES relationship")
    print("="*80)
    
    # Check which modules have tenant relationships
    result = conn.execute(text("""
        SELECT 
            m.id,
            m.code,
            m.name,
            m.is_active,
            COUNT(DISTINCT tm.tenant_id) as tenant_count
        FROM modules m
        LEFT JOIN tenant_modules tm ON m.id = tm.module_id
        GROUP BY m.id, m.code, m.name, m.is_active
        ORDER BY m.id
    """))
    
    print(f"\n{'ID':<4} {'Code':<25} {'Active':<8} {'Tenants':<10} Name")
    print("-" * 80)
    
    working_ids = []
    not_working_ids = []
    
    for row in result:
        status = "✅" if row.tenant_count > 0 else "❌"
        active = "Yes" if row.is_active else "No"
        print(f"{row.id:<4} {row.code:<25} {active:<8} {status} {row.tenant_count:<8} {row.name}")
        
        if row.code in ['blog', 'endometriosis_test', 'cycle_predictor']:
            working_ids.append(row.id)
        elif row.code == 'recommendations':
            not_working_ids.append(row.id)
    
    print("\n" + "="*80)
    print("PATTERN ANALYSIS")
    print("="*80)
    print(f"\n✅ Working modules (visible in admin): IDs {working_ids}")
    print(f"❌ Not working modules: IDs {not_working_ids}")
    
    # Check if there's a pattern with tenant relationships
    print("\n" + "="*80)
    print("TENANT MODULE ASSIGNMENTS")
    print("="*80)
    
    result = conn.execute(text("""
        SELECT 
            tm.tenant_id,
            d.nombre_completo,
            m.code,
            tm.is_enabled
        FROM tenant_modules tm
        JOIN doctors d ON d.id = tm.tenant_id
        JOIN modules m ON m.id = tm.module_id
        ORDER BY tm.tenant_id, m.code
    """))
    
    for row in result:
        enabled = "✅" if row.is_enabled else "❌"
        print(f"Tenant {row.tenant_id} ({row.nombre_completo}): {enabled} {row.code}")
