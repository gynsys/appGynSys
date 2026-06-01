from app.db.session import SessionLocal
from sqlalchemy import text
db = SessionLocal()
db.execute(text("DELETE FROM alembic_version"))
db.execute(text("INSERT INTO alembic_version (version_num) VALUES ('13be905cd722')"))
db.commit()
print("Fixed alembic version table!")
db.close()
