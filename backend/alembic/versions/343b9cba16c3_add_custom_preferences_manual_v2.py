"""add_custom_preferences_manual_v2

Revision ID: 343b9cba16c3
Revises: 5e65b534aa40
Create Date: 2026-02-09 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '343b9cba16c3'
down_revision = '5e65b534aa40'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('cycle_notification_settings', sa.Column('custom_preferences', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('cycle_notification_settings', 'custom_preferences')
