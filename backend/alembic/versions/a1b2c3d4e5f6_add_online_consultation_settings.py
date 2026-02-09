"""Add online consultation settings table

Revision ID: a1b2c3d4e5f6
Revises: bff14c07dae5
Create Date: 2026-01-20 07:05:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'FFFFFFFFFF11'
down_revision = 'bff14c07dae5'  # Updated to current head
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create online_consultation_settings table
    op.create_table('online_consultation_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('first_consultation_price', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('followup_price', sa.Float(), nullable=False, server_default='40.0'),
        sa.Column('currency', sa.String(), nullable=False, server_default='USD'),
        sa.Column('payment_methods', sa.JSON(), nullable=False, server_default='["zelle", "paypal", "bank_transfer"]'),
        sa.Column('available_hours', sa.JSON(), nullable=False, server_default='{"start": "09:00", "end": "17:00", "days": [1, 2, 3, 4, 5]}'),
        sa.Column('session_duration_minutes', sa.Integer(), nullable=False, server_default='45'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('doctor_id')  # One settings record per doctor
    )
    op.create_index(op.f('ix_online_consultation_settings_id'), 'online_consultation_settings', ['id'], unique=False)
    op.create_index(op.f('ix_online_consultation_settings_doctor_id'), 'online_consultation_settings', ['doctor_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_online_consultation_settings_doctor_id'), table_name='online_consultation_settings')
    op.drop_index(op.f('ix_online_consultation_settings_id'), table_name='online_consultation_settings')
    op.drop_table('online_consultation_settings')
