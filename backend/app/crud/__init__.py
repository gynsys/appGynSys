# CRUD operations package
from .admin import (
    # Tenant operations
    get_tenant, get_tenant_by_slug, get_tenant_by_email, get_tenants,
    create_tenant, update_tenant, update_tenant_status, delete_tenant,
    # Plan operations
    get_plan, get_plans, create_plan, update_plan, delete_plan,
    # Module operations
    get_module, get_module_by_code, get_modules, create_module, update_module, delete_module,
    # Tenant-Module operations
    get_tenant_modules, get_enabled_tenant_modules, enable_tenant_module,
    disable_tenant_module, update_tenant_modules
)