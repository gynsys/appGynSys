from app.db.base import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'push_subscriptions';"))
    for row in result:
        print(row)
