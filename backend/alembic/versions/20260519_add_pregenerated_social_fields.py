"""add pregenerated social fields to blog posts

Revision ID: add_pregenerated_social_fields
Revises: 1929a97b96ec
Create Date: 2026-05-19 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_pregenerated_social_fields'
down_revision: Union[str, None] = '1929a97b96ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('blog_posts', sa.Column('pregenerated_reel', sa.JSON(), nullable=True))
    op.add_column('blog_posts', sa.Column('pregenerated_carousel', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('blog_posts', 'pregenerated_carousel')
    op.drop_column('blog_posts', 'pregenerated_reel')
