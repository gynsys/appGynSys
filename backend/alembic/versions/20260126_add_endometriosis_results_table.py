"""add endometriosis_results table

Revision ID: 20260126_add_endo
Revises: 20260126_add_whatsapp
Create Date: 2026-01-26 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = '20260126_add_endo'
down_revision = '20260126_add_whatsapp'
branch_labels = None
depends_on = None


def upgrade():
    # Helper to check if table exists
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if 'endometriosis_results' not in tables:
        print("Creating endometriosis_results table...")
        op.create_table('endometriosis_results',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('doctor_id', sa.Integer(), nullable=False),
            sa.Column('patient_identifier', sa.String(), nullable=True),
            sa.Column('score', sa.Integer(), nullable=False),
            sa.Column('total_questions', sa.Integer(), nullable=False),
            sa.Column('result_level', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_endometriosis_results_doctor_id'), 'endometriosis_results', ['doctor_id'], unique=False)
        op.create_index(op.f('ix_endometriosis_results_id'), 'endometriosis_results', ['id'], unique=False)
        op.create_foreign_key(None, 'endometriosis_results', 'doctors', ['doctor_id'], ['id'])
    else:
        print("Table endometriosis_results already exists. Skipping.")


def downgrade():
    op.drop_index(op.f('ix_endometriosis_results_id'), table_name='endometriosis_results')
    op.drop_index(op.f('ix_endometriosis_results_doctor_id'), table_name='endometriosis_results')
    op.drop_table('endometriosis_results')
