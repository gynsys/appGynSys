"""merge_heads

Revision ID: 3787361c3e45
Revises: 343b9cba16c3, 64e30efabce1
Create Date: 2026-05-10 23:36:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3787361c3e45'
down_revision = ('343b9cba16c3', '64e30efabce1')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
