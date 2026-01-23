"""add_featured_column_to_gallery_images

Revision ID: cf9928c9969b
Revises: e5090d434b7f
Create Date: 2025-12-09 17:59:37.151187

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cf9928c9969b'
down_revision = 'e5090d434b7f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('gallery_images', sa.Column('featured', sa.Boolean(), nullable=True))
    # Set default value for existing records
    op.execute('UPDATE gallery_images SET featured = false WHERE featured IS NULL')
    # Now make it NOT NULL
    op.alter_column('gallery_images', 'featured', nullable=False)


def downgrade() -> None:
    op.drop_column('gallery_images', 'featured')

