"""add is_clinic to doctor

Revision ID: add_is_clinic_to_doctor
Revises: add_clinic_fields_to_doctor
Create Date: 2026-05-28 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_is_clinic_to_doctor'
down_revision: Union[str, None] = 'add_clinic_fields_to_doctor'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('doctors')]
    if 'is_clinic' not in columns:
        op.add_column('doctors', sa.Column('is_clinic', sa.Boolean(), server_default=sa.text('false'), nullable=True))

def downgrade() -> None:
    op.drop_column('doctors', 'is_clinic')
