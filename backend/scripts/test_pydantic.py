from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# Mock classes to simulate the issue
class Module(BaseModel):
    id: int
    code: str
    name: str

class TenantBase(BaseModel):
    id: int
    slug: str

class Tenant(TenantBase):
    enabled_modules: List[str] = Field(default=[], validation_alias="enabled_module_codes")
    
    class Config:
        from_attributes = True

class TenantWithModules(Tenant):
    enabled_modules: List[Module] = []

    class Config:
        from_attributes = True

# Mock DB Object
class MockModule:
    def __init__(self, code, name):
        self.code = code
        self.name = name
        self.id = 1

class MockTenantModule:
    def __init__(self, module):
        self.module = module
        self.is_enabled = True

class MockDoctor:
    def __init__(self):
        self.id = 1
        self.slug = "test"
        self.tenant_modules = [MockTenantModule(MockModule("endo", "Endo Test"))]

    @property
    def enabled_module_codes(self):
        return [tm.module.code for tm in self.tenant_modules if tm.is_enabled]

def test_serialization():
    doctor = MockDoctor()
    print(f"Doctor enabled codes: {doctor.enabled_module_codes}")

    # Test Tenant (List View)
    try:
        tenant = Tenant.model_validate(doctor)
        print(f"Tenant (List) enabled_modules: {tenant.enabled_modules}")
    except Exception as e:
        print(f"Tenant validation failed: {e}")

    # Test TenantWithModules (Detail View)
    try:
        # This is what the endpoint does:
        # 1. Get enabled modules list manually
        enabled_modules_list = [Module(id=1, code="endo", name="Endo Test")]
        
        # 2. Validate model from DB object
        # This is where it might fail or produce wrong data because of the alias inheritance
        tenant_with_modules = TenantWithModules.model_validate(doctor)
        print(f"TenantWithModules initial enabled_modules: {tenant_with_modules.enabled_modules}")
        
        # 3. Manually overwrite
        tenant_with_modules.enabled_modules = enabled_modules_list
        print(f"TenantWithModules final enabled_modules: {tenant_with_modules.enabled_modules}")
        
        # Check serialization
        print(f"Serialized: {tenant_with_modules.model_dump()}")

    except Exception as e:
        print(f"TenantWithModules validation failed: {e}")

if __name__ == "__main__":
    test_serialization()
