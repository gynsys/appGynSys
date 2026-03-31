"""merge_all_notif

Revision ID: merge_all_notif
Revises: acfb5f99cde1, 37eb03e25895, 20260215_pnd_notif
Create Date: 2026-02-17 14:26:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_all_notif'
down_revision = ('acfb5f99cde1', '37eb03e25895', '20260215_pnd_notif')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
