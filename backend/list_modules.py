
import logging
from app.db.base import SessionLocal
from app.db.models.module import Module

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def list_modules():
    session = SessionLocal()
    try:
        modules = session.query(Module).all()
        print(f"Total Modules: {len(modules)}")
        for m in modules:
            print(f"- [{m.id}] {m.name} ({m.code}) | Active: {m.is_active}")
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    list_modules()
