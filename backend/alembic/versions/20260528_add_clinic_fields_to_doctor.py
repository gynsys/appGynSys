"""add clinic fields to doctor

Revision ID: add_clinic_fields_to_doctor
Revises: add_llm_providers_table
Create Date: 2026-05-28 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_clinic_fields_to_doctor'
down_revision: Union[str, None] = 'add_llm_providers_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use inspector to check if columns exist
    bind = op.get_bind()
    from sqlalchemy.engine.reflection import Inspector
    inspector = Inspector.from_engine(bind)
    columns = [col['name'] for col in inspector.get_columns('doctors')]

    # Add new fields to doctors table for multi-tenant clinic logic
    if 'role' not in columns:
        op.add_column('doctors', sa.Column('role', sa.String(length=50), server_default='user', nullable=True))
    if 'clinic_id' not in columns:
        op.add_column('doctors', sa.Column('clinic_id', sa.Integer(), nullable=True))
        # Create foreign key constraint from doctors.clinic_id to doctors.id
        op.create_foreign_key('fk_doctors_clinic_id', 'doctors', 'doctors', ['clinic_id'], ['id'], ondelete='SET NULL')
    if 'permissions' not in columns:
        op.add_column('doctors', sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

def downgrade() -> None:
    op.drop_constraint('fk_doctors_clinic_id', 'doctors', type_='foreignkey')
    op.drop_column('doctors', 'permissions')
    op.drop_column('doctors', 'clinic_id')
    op.drop_column('doctors', 'role')
