"""
Add blog_post_id to services table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251218addblogpostid'
down_revision = '67ac38bd90b5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('services', sa.Column('blog_post_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_services_blog_post_id', 'services', 'blog_posts', ['blog_post_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_services_blog_post_id', 'services', type_='foreignkey')
    op.drop_column('services', 'blog_post_id')
