from sqlalchemy import create_engine, text
import os

db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys")
engine = create_engine(db_url)

with engine.connect() as con:
    print('--- ROWS ---')
    count = con.execute(text('SELECT count(*) FROM notification_rules')).scalar()
    print(f'Count: {count}')
    
    res = con.execute(text('SELECT notification_type, tenant_id FROM notification_rules LIMIT 10'))
    for row in res:
        print(row)
    
    print('\n--- CONSTRAINTS ---')
    res = con.execute(text("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'notification_rules'::regclass"))
    for row in res:
        print(f"{row[0]}: {row[1]}")
        
    print('\n--- INDEXES ---')
    res = con.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='notification_rules'"))
    for row in res:
        print(f"{row[0]}: {row[1]}")
con.close()
