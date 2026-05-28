"""add assigned_staff_id to appointments

Revision ID: add_assigned_staff_id
Revises: add_max_staff_members
Create Date: 2026-05-28 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_assigned_staff_id'
down_revision: Union[str, None] = 'add_max_staff_members'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('appointments')]
    if 'assigned_staff_id' not in columns:
        op.add_column('appointments', sa.Column('assigned_staff_id', sa.Integer(), sa.ForeignKey('doctors.id'), nullable=True))

def downgrade() -> None:
    op.drop_column('appointments', 'assigned_staff_id')
