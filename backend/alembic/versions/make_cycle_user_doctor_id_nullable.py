"""make_cycle_user_doctor_id_nullable

Revision ID: make_cycle_user_doctor_id_nullable
Revises: 20260224_drop_pending_unique, c933241a7dfe
Create Date: 2026-03-08 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_cycle_user_doctor_id_nullable'
down_revision = ('20260224_drop_pending_unique', 'c933241a7dfe')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make doctor_id nullable in cycle_users table
    op.alter_column('cycle_users', 'doctor_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    # Make doctor_id non-nullable again
    # Note: This might fail if there are users with null doctor_id
    op.alter_column('cycle_users', 'doctor_id',
               existing_type=sa.INTEGER(),
               nullable=False)
