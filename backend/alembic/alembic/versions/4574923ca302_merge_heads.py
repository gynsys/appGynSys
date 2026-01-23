"""merge heads

Revision ID: 4574923ca302
Revises: 20251218addblogpostid, c4ac467c9380
Create Date: 2025-12-18 19:38:05.470680

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4574923ca302'
down_revision = ('20251218addblogpostid', 'c4ac467c9380')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
