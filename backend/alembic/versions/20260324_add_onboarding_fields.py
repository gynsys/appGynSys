"""add_onboarding_fields

Revision ID: add_onboarding_fields
Revises: add_preg_assets_photo_url
Create Date: 2026-03-24 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_onboarding_fields'
down_revision = 'add_preg_assets_photo_url'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add location column to appointments
    op.add_column('appointments', sa.Column('location', sa.String(), nullable=True))
    
    # 2. Convert preconsulta_answers from Text to JSON
    # This assumes PostgreSQL as per config.py
    op.execute('ALTER TABLE appointments ALTER COLUMN preconsulta_answers TYPE JSON USING preconsulta_answers::json')

def downgrade() -> None:
    # Convert back to Text
    op.execute('ALTER TABLE appointments ALTER COLUMN preconsulta_answers TYPE TEXT USING preconsulta_answers::text')
    
    # Remove location column
    op.drop_column('appointments', 'location')
