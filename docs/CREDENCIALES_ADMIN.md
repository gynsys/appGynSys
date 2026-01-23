# Credenciales de Acceso - Sistema GynSys

## Admin del Sistema (Super Admin)

**Para acceder al panel de administración global** (`/admin/modules`, `/admin/tenants`, `/admin/plans`):

- **Email**: `admin@appgynsys.com`
- **Contraseña**: `adminpassword`
- **URL de acceso**: `http://localhost:5173/admin`


## Admin de Inquilino - Dra. Mariel Herrera

**Para acceder al panel de administración del perfil** (`/dashboard`):

- **Email**: `milanopabloe@gmail.com`
- **Contraseña**: [tu contraseña actual]
- **URL de acceso**: `http://localhost:5173/dashboard`

---

## Notas Importantes

> [!WARNING]
> La contraseña `admin123` es una contraseña de desarrollo. En producción, deberías cambiarla por una contraseña segura.

### Cambiar la Contraseña del Admin

Si deseas cambiar la contraseña del admin del sistema, ejecuta:

```bash
cd backend
python scripts/reset_password_custom.py
```

O usa el script `create_admin_user.py` que actualizará la contraseña a `admin123`.

