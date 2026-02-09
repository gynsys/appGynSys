"""add oauth whitelist table

Revision ID: a1b2c3d4e5f7
Revises: f1a2b3c4d5e7
Create Date: 2026-02-08 16:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f7'
down_revision = 'f1a2b3c4d5e7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'oauth_whitelist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('domain', sa.String(), nullable=True),
        sa.Column('added_by', sa.Integer(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['added_by'], ['doctors.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('email IS NOT NULL OR domain IS NOT NULL', name='email_or_domain_required')
    )
    
    op.create_index('ix_oauth_whitelist_email', 'oauth_whitelist', ['email'], unique=False)
    op.create_index('ix_oauth_whitelist_domain', 'oauth_whitelist', ['domain'], unique=False)
    op.create_index('ix_oauth_whitelist_is_active', 'oauth_whitelist', ['is_active'], unique=False)


def downgrade():
    op.drop_index('ix_oauth_whitelist_is_active', table_name='oauth_whitelist')
    op.drop_index('ix_oauth_whitelist_domain', table_name='oauth_whitelist')
    op.drop_index('ix_oauth_whitelist_email', table_name='oauth_whitelist')
    op.drop_table('oauth_whitelist ')
