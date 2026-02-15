"""add pending notifications table

Revision ID: 20260215_pnd_notif
Revises: 437ff999549b
Create Date: 2026-02-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260215_pnd_notif'
down_revision = '343b9cba16c3'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('pending_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('notification_rule_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=False),
        sa.Column('channel', sa.String(), nullable=False, server_default='dual'),
        sa.Column('status', sa.String(), nullable=True, server_default='pending'),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['notification_rule_id'], ['notification_rules.id'], ),
        sa.ForeignKeyConstraint(['recipient_id'], ['cycle_users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pending_notifications_id'), 'pending_notifications', ['id'], unique=False)
    op.create_index(op.f('ix_pending_notifications_recipient_id'), 'pending_notifications', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_pending_notifications_scheduled_for'), 'pending_notifications', ['scheduled_for'], unique=False)
    op.create_index(op.f('ix_pending_notifications_status'), 'pending_notifications', ['status'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_pending_notifications_status'), table_name='pending_notifications')
    op.drop_index(op.f('ix_pending_notifications_scheduled_for'), table_name='pending_notifications')
    op.drop_index(op.f('ix_pending_notifications_recipient_id'), table_name='pending_notifications')
    op.drop_index(op.f('ix_pending_notifications_id'), table_name='pending_notifications')
    op.drop_table('pending_notifications')
