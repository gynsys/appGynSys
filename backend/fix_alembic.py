from app.db.session import SessionLocal
from sqlalchemy import text
db = SessionLocal()
db.execute(text("UPDATE alembic_version SET version_num='0b11fb8ec236'"))
db.commit()
db.close()
