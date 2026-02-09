"""merge_migration_heads_fix

Revision ID: 437ff999549b
Revises: 20260127_seed_endo, FFFFFFFFFF11, f1a2b3c4d5e7
Create Date: 2026-02-04 21:52:39.749163

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '437ff999549b'
down_revision = ('20260127_seed_endo', 'FFFFFFFFFF11', 'f1a2b3c4d5e7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

