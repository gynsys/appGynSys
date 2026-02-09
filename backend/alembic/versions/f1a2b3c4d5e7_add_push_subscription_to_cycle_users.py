"""add push_subscription to cycle_users

Revision ID: f1a2b3c4d5e7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-30 07:15:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add push_subscription column to cycle_users table
    op.add_column('cycle_users', sa.Column('push_subscription', postgresql.JSON(), nullable=True))


def downgrade():
    # Remove push_subscription column from cycle_users table
    op.drop_column('cycle_users', 'push_subscription')
