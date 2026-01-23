# GynSys Admin Dashboard

## Descripción

El Dashboard Administrativo de GynSys es una interfaz completa para gestionar el sistema SaaS multi-tenant. Permite administrar tenants (doctores), planes de suscripción, módulos del sistema y configuraciones generales.

## Características

### 🏢 Gestión de Tenants
- **Crear y editar tenants**: Gestiona la información básica de cada doctor/tenant
- **Control de estado**: Activar, pausar o suspender tenants
- **Asignación de planes**: Vincular tenants con planes de suscripción
- **Gestión de módulos**: Habilitar/deshabilitar módulos específicos por tenant
- **Filtros avanzados**: Buscar por nombre, email, estado o plan

### 📋 Gestión de Planes
- **Planes de suscripción**: Crear y configurar diferentes niveles de servicio
- **Precios flexibles**: Configurar precios mensuales y anuales
- **Límites configurables**: Establecer límites de doctores y pacientes
- **Características**: Definir qué incluye cada plan
- **Estados**: Activar/desactivar planes según sea necesario

### 🧩 Gestión de Módulos
- **Módulos del sistema**: Gestionar funcionalidades disponibles
- **Códigos únicos**: Identificadores únicos para cada módulo
- **Estados**: Activar/desactivar módulos globalmente
- **Asignación por tenant**: Control granular de qué módulos tiene cada tenant

## Acceso al Dashboard

### Desde el Panel de Doctor
Los usuarios autenticados pueden acceder al dashboard administrativo desde su panel de doctor haciendo clic en "Admin Sistema".

### URL Directa
También se puede acceder directamente a:
- `/admin` - Dashboard principal
- `/admin/tenants` - Gestión de tenants
- `/admin/plans` - Gestión de planes
- `/admin/modules` - Gestión de módulos

## API Endpoints

El dashboard consume los siguientes endpoints de la API:

### Tenants
- `GET /api/v1/admin/tenants` - Listar tenants
- `POST /api/v1/admin/tenants` - Crear tenant
- `GET /api/v1/admin/tenants/{id}` - Obtener tenant específico
- `PUT /api/v1/admin/tenants/{id}` - Actualizar tenant
- `PATCH /api/v1/admin/tenants/{id}/status` - Cambiar estado
- `DELETE /api/v1/admin/tenants/{id}` - Eliminar tenant
- `PUT /api/v1/admin/tenants/{id}/modules` - Gestionar módulos

### Planes
- `GET /api/v1/admin/plans` - Listar planes
- `POST /api/v1/admin/plans` - Crear plan
- `PUT /api/v1/admin/plans/{id}` - Actualizar plan
- `DELETE /api/v1/admin/plans/{id}` - Eliminar plan

### Módulos
- `GET /api/v1/admin/modules` - Listar módulos
- `POST /api/v1/admin/modules` - Crear módulo
- `PUT /api/v1/admin/modules/{id}` - Actualizar módulo
- `DELETE /api/v1/admin/modules/{id}` - Eliminar módulo

## Arquitectura Técnica

### Frontend
- **React 18** con hooks y componentes funcionales
- **React Router** para navegación
- **Zustand** para gestión de estado global
- **Axios** para llamadas a la API con interceptores JWT
- **Tailwind CSS** para estilos responsivos
- **Headless UI** para componentes accesibles

### Backend
- **FastAPI** con endpoints RESTful
- **SQLAlchemy** con modelos relacionales
- **Pydantic** para validación de datos
- **Alembic** para migraciones de base de datos

### Base de Datos
- **SQLite** para desarrollo (fácil de configurar)
- **Modelos relacionales** con claves foráneas
- **Tablas principales**: tenants, plans, modules, tenant_modules

## Seguridad

- **Autenticación JWT**: Todas las llamadas requieren token válido
- **Protección de rutas**: Componente `AdminRoute` para acceso restringido
- **Validación de datos**: Tanto en frontend como backend
- **CORS configurado**: Solo orígenes permitidos

## Próximos Pasos

### Fase 4: Integración y Testing
- [ ] Implementar autenticación específica para administradores
- [ ] Agregar roles y permisos granulares
- [ ] Crear tests unitarios e integración
- [ ] Implementar logging y auditoría
- [ ] Agregar métricas y analytics

### Mejoras Futuras
- [ ] Dashboard con gráficos y estadísticas avanzadas
- [ ] Sistema de notificaciones
- [ ] API de billing y pagos
- [ ] Multi-tenancy avanzado con aislamiento de datos
- [ ] Internacionalización (i18n)

## Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn
- Backend de GynSys corriendo

### Instalación
```bash
cd frontend
npm install
npm run dev
```

### Build de Producción
```bash
npm run build
```

## Contribución

Para contribuir al dashboard administrativo:

1. Seguir los patrones de código existentes
2. Usar TypeScript para nuevos componentes cuando sea posible
3. Mantener consistencia con el diseño de Tailwind CSS
4. Agregar tests para nuevas funcionalidades
5. Documentar cambios significativos

## Soporte

Para soporte técnico o preguntas sobre el dashboard administrativo, contactar al equipo de desarrollo.