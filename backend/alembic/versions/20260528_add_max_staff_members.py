"""add max_staff_members to plans

Revision ID: add_max_staff_members
Revises: add_is_clinic_to_doctor
Create Date: 2026-05-28 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_max_staff_members'
down_revision: Union[str, None] = 'add_is_clinic_to_doctor'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('plans')]
    if 'max_staff_members' not in columns:
        op.add_column('plans', sa.Column('max_staff_members', sa.Integer(), server_default=sa.text('0'), nullable=True))

def downgrade() -> None:
    op.drop_column('plans', 'max_staff_members')
