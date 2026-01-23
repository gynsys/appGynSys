"""add_card_shadow_to_doctor

Revision ID: 76f487b0a997
Revises: 67ac38bd90b5
Create Date: 2025-12-02 21:31:41.924984

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '76f487b0a997'
down_revision = '67ac38bd90b5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('doctors', sa.Column('card_shadow', sa.Boolean(), nullable=True, server_default='true'))


def downgrade() -> None:
    op.drop_column('doctors', 'card_shadow')

