"""add_container_shadow_to_doctor

Revision ID: 3f06a7f9db94
Revises: 76f487b0a997
Create Date: 2025-12-02 21:47:59.350614

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3f06a7f9db94'
down_revision = '76f487b0a997'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('doctors', sa.Column('container_shadow', sa.Boolean(), nullable=True, server_default='true'))


def downgrade() -> None:
    op.drop_column('doctors', 'container_shadow')

