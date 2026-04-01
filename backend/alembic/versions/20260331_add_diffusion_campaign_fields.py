"""add_diffusion_campaign_fields

Revision ID: add_diffusion_campaign_fields
Revises: add_onboarding_fields
Create Date: 2026-03-31 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_diffusion_campaign_fields'
down_revision = 'add_onboarding_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create diffusion_campaign table
    op.create_table(
        'diffusion_campaign',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('content_html', sa.Text(), nullable=False),
        sa.Column('content_text', sa.Text(), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('target_type', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('stats', sa.JSON(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['doctors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diffusion_campaign_id'), 'diffusion_campaign', ['id'], unique=False)
    op.create_index(op.f('ix_diffusion_campaign_tenant_id'), 'diffusion_campaign', ['tenant_id'], unique=False)

    # 2. Create campaign_contact table (MISSING IN ORIGINAL)
    op.create_table(
        'campaign_contact',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=True),
        sa.Column('cycle_user_id', sa.Integer(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cycle_user_id'], ['cycle_users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['doctors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaign_contact_email'), 'campaign_contact', ['email'], unique=False)
    op.create_index(op.f('ix_campaign_contact_id'), 'campaign_contact', ['id'], unique=False)
    op.create_index(op.f('ix_campaign_contact_tenant_id'), 'campaign_contact', ['tenant_id'], unique=False)

    # 3. Add columns to pending_notifications
    op.add_column('pending_notifications', sa.Column('recipient_email_direct', sa.String(), nullable=True))
    op.add_column('pending_notifications', sa.Column('recipient_name_direct', sa.String(), nullable=True))

    # 4. Add columns to notification_logs
    op.add_column('notification_logs', sa.Column('recipient_email_direct', sa.String(), nullable=True))
    op.add_column('notification_logs', sa.Column('recipient_name_direct', sa.String(), nullable=True))

def downgrade() -> None:
    # Remove columns from notification_logs
    op.drop_column('notification_logs', 'recipient_name_direct')
    op.drop_column('notification_logs', 'recipient_email_direct')

    # Remove columns from pending_notifications
    op.drop_column('pending_notifications', 'recipient_name_direct')
    op.drop_column('pending_notifications', 'recipient_email_direct')

    # Drop campaign_contact table
    op.drop_index(op.f('ix_campaign_contact_tenant_id'), table_name='campaign_contact')
    op.drop_index(op.f('ix_campaign_contact_id'), table_name='campaign_contact')
    op.drop_index(op.f('ix_campaign_contact_email'), table_name='campaign_contact')
    op.drop_table('campaign_contact')

    # Drop diffusion_campaign table
    op.drop_index(op.f('ix_diffusion_campaign_tenant_id'), table_name='diffusion_campaign')
    op.drop_index(op.f('ix_diffusion_campaign_id'), table_name='diffusion_campaign')
    op.drop_table('diffusion_campaign')
