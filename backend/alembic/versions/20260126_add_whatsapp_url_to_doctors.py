"""add whatsapp_url to doctors

Revision ID: 20260126_add_whatsapp
Revises: fe81e612c6f6
Create Date: 2026-01-26 16:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = '20260126_add_whatsapp'
down_revision = 'fe81e612c6f6' # Pointing to the last known migration from list_dir
branch_labels = None
depends_on = None

def upgrade():
    # Helper to check if column exists to avoid errors on already patched DBs
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [col['name'] for col in inspector.get_columns('doctors')]
    
    
    if 'whatsapp_url' not in columns:
        print("Adding whatsapp_url column to doctors table...")
        op.add_column('doctors', sa.Column('whatsapp_url', sa.String(), nullable=True))
    else:
        print("Column whatsapp_url already exists. Skipping.")

    if 'visitor_count' not in columns:
        print("Adding visitor_count column to doctors table...")
        op.add_column('doctors', sa.Column('visitor_count', sa.Integer(), nullable=False, server_default='0'))
    else:
        print("Column visitor_count already exists. Skipping.")

def downgrade():
    op.drop_column('doctors', 'whatsapp_url')
    op.drop_column('doctors', 'visitor_count')
