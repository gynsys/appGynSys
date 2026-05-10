"""manual fix for missing revision
Revision ID: 0b8315d53f8f
Revises: merge_all_notif
Create Date: 2026-04-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '0b8315d53f8f'
down_revision = 'merge_all_notif'
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
