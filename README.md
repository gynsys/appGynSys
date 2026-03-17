# GynSys Project

Bienvenido al repositorio de GynSys. Para facilitar el mantenimiento y la operación del sistema, hemos centralizado toda la documentación y guías operativas en la carpeta `readme/`.

> [!IMPORTANT]
> **GUÍA DE CONTEXTO RÁPIDO PARA IA (MUST READ)**:
> Si eres una IA asistiendo en este proyecto, sigue este orden de lectura según el problema para evitar errores recurrentes:
>
> 1. **El "Escudo" contra pérdida de tiempo (Imprescindible)**:
>    - [**readme/tips_and_best_practices.md**](./readme/tips_and_best_practices.md): Contiene la **"Regla de Oro"** para evitar fallos de escape SQL y explica el conflicto crítico de **Doctor vs Paciente** (Smart UPSERT).
>
> 2. **Contexto General y Operativo**:
>    - [**readme/saas_ops.md**](./readme/saas_ops.md): Mapa mental del sistema multi-inquilino (Tenants), dominios y configuración.
>    - [**readme/technical_guide.md**](./readme/technical_guide.md): Manual básico de arquitectura (Backend, Frontend, DB).
>
> 3. **Si el problema es de Notificaciones o App Móvil**:
>    - [**readme/notify/diagnostico_notificaciones.md**](./readme/notify/diagnostico_notificaciones.md): Historial de incidentes y soluciones específicas de push.
>    - [**readme/capacitor_implementation.md**](./readme/capacitor_implementation.md): Integración de Capacitor y FCM para Android/iOS.
>
> 4. **Si hay errores críticos tras un despliegue o reinicio**:
>    - [**readme/guia_recuperacion_post_reinicio.md**](./readme/guia_recuperacion_post_reinicio.md): Pasos exactos para levantar el sistema.

## Documentación Disponible en `/readme`:

- [**Guía de Operaciones SaaS**](./readme/saas_ops.md): Comandos para inquilinos, restauración de admin y scripts críticos.
- [**Guía de Notificaciones**](./readme/notify_readme.md): Diagnóstico y mantenimiento del sistema de notificaciones.
- [**README Principal**](./readme/README.md): Información general del proyecto.

---
© 2024 GynSys.
