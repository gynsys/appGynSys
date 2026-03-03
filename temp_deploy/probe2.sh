#!/bin/bash
cd /opt/appgynsys
docker compose exec -T backend python -c "
try:
    import app
    print('APP_FILE:', getattr(app, '__file__', 'None'))
    import app.db
    print('APP_DB_FILE:', getattr(app.db, '__file__', 'None'))
    from app.db.session import SessionLocal
    print('SESSION_LOCAL:', SessionLocal)
except Exception as e:
    import traceback
    traceback.print_exc()
"
