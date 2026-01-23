import logging
import sys
import os

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.base import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    logger.info("Starting manual creation of Chat tables and RLS policies...")
    
    with engine.connect() as connection:
        # 1. Create chat_rooms
        logger.info("Creating chat_rooms table...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id VARCHAR NOT NULL,
                type VARCHAR DEFAULT 'direct',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                meta_data JSONB DEFAULT '{}'::jsonb
            );
            CREATE INDEX IF NOT EXISTS ix_chat_rooms_tenant_id ON chat_rooms (tenant_id);
        """))

        # 2. Create chat_participants
        logger.info("Creating chat_participants table...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_participants (
                room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
                user_id VARCHAR NOT NULL,
                tenant_id VARCHAR NOT NULL,
                role VARCHAR DEFAULT 'member',
                last_read_at TIMESTAMP WITH TIME ZONE,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (room_id, user_id)
            );
            CREATE INDEX IF NOT EXISTS ix_chat_participants_tenant_id ON chat_participants (tenant_id);
        """))

        # 3. Create chat_messages
        logger.info("Creating chat_messages table...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
                sender_id VARCHAR NOT NULL,
                tenant_id VARCHAR NOT NULL,
                client_side_uuid UUID NOT NULL,
                content TEXT,
                message_type VARCHAR DEFAULT 'text',
                media_url VARCHAR,
                media_meta JSONB DEFAULT '{}'::jsonb,
                status VARCHAR DEFAULT 'sending',
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_chat_messages_room_id ON chat_messages (room_id);
            CREATE INDEX IF NOT EXISTS ix_chat_messages_tenant_id ON chat_messages (tenant_id);
            CREATE UNIQUE INDEX IF NOT EXISTS ix_chat_messages_client_side_uuid ON chat_messages (client_side_uuid);
        """))
        
        # 4. Enable RLS
        logger.info("Enabling RLS on tables...")
        connection.execute(text("ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;"))
        connection.execute(text("ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;"))
        connection.execute(text("ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;"))

        # 5. Create Policies
        logger.info("Creating RLS policies...")
        # Drop existing to ensure update
        connection.execute(text("DROP POLICY IF EXISTS tenant_isolation_policy ON chat_rooms;"))
        connection.execute(text("DROP POLICY IF EXISTS tenant_isolation_policy ON chat_participants;"))
        connection.execute(text("DROP POLICY IF EXISTS tenant_isolation_policy ON chat_messages;"))

        policy_sql = """
            CREATE POLICY tenant_isolation_policy ON {}
            USING (tenant_id = current_setting('app.current_tenant', true));
        """
        
        connection.execute(text(policy_sql.format("chat_rooms")))
        connection.execute(text(policy_sql.format("chat_participants")))
        connection.execute(text(policy_sql.format("chat_messages")))
        
        connection.commit()
        logger.info("Successfully created tables and policies!")

if __name__ == "__main__":
    try:
        create_tables()
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        import traceback
        traceback.print_exc()
