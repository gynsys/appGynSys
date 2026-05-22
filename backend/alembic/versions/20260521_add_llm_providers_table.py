"""add llm_providers table

Revision ID: add_llm_providers_table
Revises: add_pregenerated_social_fields
Create Date: 2026-05-21 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_llm_providers_table'
down_revision: Union[str, None] = 'add_pregenerated_social_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'llm_providers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_key', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('api_key_enc', sa.Text(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('base_url', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('use_case', sa.String(), nullable=False, server_default='all'),
        sa.Column('extra_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_llm_providers_id'), 'llm_providers', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_llm_providers_id'), table_name='llm_providers')
    op.drop_table('llm_providers')
