"""merge_heads_fix

Revision ID: 5e65b534aa40
Revises: 437ff999549b, a1b2c3d4e5f7
Create Date: 2026-02-09 22:49:29.136529

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e65b534aa40'
down_revision = ('437ff999549b', 'a1b2c3d4e5f7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
