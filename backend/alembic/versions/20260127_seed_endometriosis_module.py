"""seed endometriosis module

Revision ID: 20260127_seed_endo
Revises: 20260126_add_endo
Create Date: 2026-01-27 06:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Boolean, DateTime
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '20260127_seed_endo'
down_revision = '20260126_add_endo'
branch_labels = None
depends_on = None

def upgrade():
    # Define tables for data manipulation
    modules = table('modules',
        column('id', Integer),
        column('code', String),
        column('name', String),
        column('description', String),
        column('is_active', Boolean),
        column('created_at', DateTime)
    )

    doctors = table('doctors',
        column('id', Integer),
        column('nombre_completo', String),
        column('slug_url', String)
    )

    tenant_modules = table('tenant_modules',
        column('id', Integer),
        column('tenant_id', Integer),
        column('module_id', Integer),
        column('is_enabled', Boolean),
        column('created_at', DateTime)
    )

    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    # 1. Ensure Module Exists
    endo_module = session.query(modules).filter(modules.c.code == 'endometriosis_test').first()
    
    if not endo_module:
        print("Creating 'endometriosis_test' module...")
        
        # Insert module
        op.execute(
            modules.insert().values(
                code='endometriosis_test',
                name='Test de Endometriosis',
                description='Evaluación de riesgo de endometriosis',
                is_active=True,
                created_at=datetime.utcnow()
            )
        )
        # Fetch it back
        endo_module = session.query(modules).filter(modules.c.code == 'endometriosis_test').first()

    if not endo_module:
        print("Error: Could not create module!")
        return

    module_id = endo_module.id

    # 2. Enable for ALL Doctors (Tenants)
    all_doctors = session.query(doctors).all()
    print(f"Found {len(all_doctors)} doctors. Checking permissions...")

    for doctor in all_doctors:
        # Check if already linked
        exists = session.query(tenant_modules).filter(
            tenant_modules.c.tenant_id == doctor.id,
            tenant_modules.c.module_id == module_id
        ).first()

        if not exists:
            print(f"Enabling module for doctor: {doctor.slug_url}")
            op.execute(
                tenant_modules.insert().values(
                    tenant_id=doctor.id,
                    module_id=module_id,
                    is_enabled=True,
                    created_at=datetime.utcnow()
                )
            )
        else:
            print(f"Module already enabled for: {doctor.slug_url}")

def downgrade():
    # We do not remove data in downgrade to avoid accidental data loss
    pass
