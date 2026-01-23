# Multi-tenant Isolation Audit Report

## 1. Tenant Isolation Status

### Findings
- **CRITICAL: Missing Tenant ID**: The `appgynsys` backend appears to be **Single Tenant**.
    - No `tenant_id` column found in `Patient`, `Consultation`, or `Doctor` models.
    - No `tenant_id` filtering in API queries.
    - The `gynsys` bot uses `bot_id` as a tenant identifier, but this pattern is not replicated in the SaaS backend (`appgynsys`).

### Risks
- **Data Leakage**: If this backend is intended to serve multiple doctors/clinics, there is currently **zero isolation**. A doctor could potentially access another doctor's patients if they share the same database instance.

## 2. Recommendations

1.  **Schema Change**: Add `tenant_id` (UUID) to ALL tables (`users`, `patients`, `consultations`, etc.).
2.  **Middleware**: Implement a dependency `get_current_tenant` that extracts the tenant from the subdomain (e.g., `tenant1.app.com`) or a header (`X-Tenant-ID`).
3.  **RLS (Row Level Security)**: If using PostgreSQL, enable RLS. If using SQLite/MySQL, enforce filtering in the ORM.

## 3. Fix Implementation (SQLAlchemy Mixin)

```python
# app/db/mixins.py
from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declared_attr

class TenantMixin:
    @declared_attr
    def tenant_id(cls):
        return Column(String, index=True, nullable=False)

# Usage in Models
class Patient(Base, TenantMixin):
    # ... existing columns
    pass

# Usage in Queries
def get_patients(db: Session, tenant_id: str):
    return db.query(Patient).filter(Patient.tenant_id == tenant_id).all()
```
