"""add_last_contraceptive_sent_date

Revision ID: 37eb03e25895
Revises: 4e78332ef952
Create Date: 2026-01-17 05:08:11.308867

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '37eb03e25895'
down_revision = '4e78332ef952'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cycle_notification_settings', sa.Column('last_contraceptive_sent_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('cycle_notification_settings', 'last_contraceptive_sent_date')

