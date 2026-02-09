"""add tenant_id and encryption

Revision ID: e1a2b3c4d5e6
Revises: d68867a83471
Create Date: 2025-12-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1a2b3c4d5e6'
down_revision = 'd68867a83471'
branch_labels = None
depends_on = None


def upgrade():
    # Add tenant_id column to patients table
    # nullable=True initially to allow existing rows
    op.add_column('patients', sa.Column('tenant_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_patients_tenant_id'), 'patients', ['tenant_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_patients_tenant_id'), table_name='patients')
    op.drop_column('patients', 'tenant_id')
