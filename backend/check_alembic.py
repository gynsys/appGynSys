from app.db.session import SessionLocal
from sqlalchemy import text
db = SessionLocal()
res = db.execute(text("SELECT * FROM alembic_version")).fetchall()
with open("/app/db_res.txt", "w") as f:
    f.write(str(res))
db.close()
