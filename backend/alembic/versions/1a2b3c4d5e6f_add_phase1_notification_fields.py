"""add phase 1 notification fields

Revision ID: 1a2b3c4d5e6f
Revises: 37eb03e25895
Create Date: 2026-01-18 15:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = '37eb03e25895'
branch_labels = None
depends_on = None


def upgrade():
    # Add new notification settings fields for Phase 1 enhancements
    op.add_column('cycle_notification_settings',
        sa.Column('rhythm_abstinence_alerts', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('cycle_notification_settings',
        sa.Column('period_confirmation_reminder', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('cycle_notification_settings',
        sa.Column('last_period_reminder_sent', sa.Date(), nullable=True))


def downgrade():
    # Remove Phase 1 notification fields
    op.drop_column('cycle_notification_settings', 'last_period_reminder_sent')
    op.drop_column('cycle_notification_settings', 'period_confirmation_reminder')
    op.drop_column('cycle_notification_settings', 'rhythm_abstinence_alerts')
