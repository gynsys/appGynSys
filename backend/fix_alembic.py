from sqlalchemy import create_engine, text
engine = create_engine("postgresql://postgres:postgres@db/gynsys")
with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num='13be905cd722'"))
    conn.commit()
