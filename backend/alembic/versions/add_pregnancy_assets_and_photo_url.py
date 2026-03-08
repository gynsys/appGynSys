"""Add photo_url to CycleUser and create PregnancyAsset table

Revision ID: add_preg_assets_photo_url
Revises: make_cycle_user_doc_nullable
Create Date: 2026-03-08 14:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_preg_assets_photo_url'
down_revision = 'make_cycle_user_doc_nullable'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add photo_url to cycle_users
    op.add_column('cycle_users', sa.Column('photo_url', sa.String(length=255), nullable=True))
    
    # Create pregnancy_assets table
    op.create_table('pregnancy_assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cycle_user_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('url', sa.String(length=255), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cycle_user_id'], ['cycle_users.id'], )
    )
    op.create_index(op.f('ix_pregnancy_assets_cycle_user_id'), 'pregnancy_assets', ['cycle_user_id'], unique=False)
    op.create_index(op.f('ix_pregnancy_assets_id'), 'pregnancy_assets', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_pregnancy_assets_id'), table_name='pregnancy_assets')
    op.drop_index(op.f('ix_pregnancy_assets_cycle_user_id'), table_name='pregnancy_assets')
    op.drop_table('pregnancy_assets')
    op.drop_column('cycle_users', 'photo_url')
