# Sistema de Notificaciones de Campañas y Depuración de Fallas

Este documento detalla el funcionamiento del sistema de difusión de campañas de GyNSys, el diagnóstico de la falla de redirección al doctor y las medidas correctivas permanentes aplicadas.

## 1. Arquitectura del Flujo de Notificación

El sistema opera en tres capas desacopladas para garantizar escalabilidad:

### A. Capa de Expansión (`backend/app/tasks/campaigns.py`)
- Al lanzar una campaña, la tarea `process_diffusion_campaign` busca los destinatarios según el filtro (Todos, Pacientes, Usuarios App o Selección Manual).
- **Snapshot de Resiliencia**: Se graba obligatoriamente el campo `recipient_email_direct`. Esto asegura que si el email de un paciente cambia después, la campaña se envíe al correo original seleccionado. Se han añadido validaciones para omitir registros con correos malformados o vacíos.

### B. Capa de Cola (`backend/app/tasks/notifications.py`)
- Un proceso de **Celery Beat** recorre cada 60 segundos la tabla `pending_notifications`.
- Selecciona los registros con estado `pending` y los envía al procesador central.

### C. Capa de Entrega (`backend/app/services/notifications/sender.py`)
- Es el cerebro que decide a dónde va el correo y el Push. Se ha implementado una jerarquía estricta de seguridad.

---

## 2. Diagnóstico de la Falla: "La Sombra del Doctor"

### El Problema
Los correos de campaña dirigidos a suscriptores externos estaban llegando al buzón de la doctora (`milanopabloe@gmail.com`).

### Causas Raíz Corregidas
1.  **Falla de Jerarquía**: El sistema prefería el perfil del usuario incluso si había un correo directo de campaña. Si el perfil tenía el correo del doctor (por pruebas previas), ocurría el desvío.
2.  **Fallback Administrativo Indiscriminado**: Cualquier error en la resolución del destinatario enviaba el correo al administrador ("Doctor Fallback").
3.  **Estado Sent Ficticio**: No se validaba el retorno real del servicio de email.

---

## 3. Acciones Correctivas Aplicadas (Producción)

### [BACKEND] Jerarquía Estricta con Salvaguarda SaaS
Se modificó `sender.py` para aplicar la jerarquía **"Snapshot First - SaaS Protected"**:
- **PRIORIDAD 1 (Campañas)**: Si existe `recipient_email_direct`, se usa y **se prohíbe** consultar el perfil. Esto elimina la redirección fantasma.
- **PRIORIDAD 2 (SaaS Core)**: Si no hay email directo, se usa el perfil del usuario (`recipient_id`). Esto mantiene intactas las notificaciones del SaaS para pacientes.
- **PRIORIDAD 3 (Admin)**: El correo del doctor se reserva **exclusivamente** para notificaciones administrativas (sin destinatario). Nunca se usará como fallback para campañas.

### [BACKEND] Validación de Entrega
El sistema ahora captura el estado booleano de **Resend/SMTP**. Si el envío falla, la notificación se marca como `failed` con su error correspondiente en lugar de aparecer como exitosa.

---

## 4. Mantenimiento y Limpieza de Datos

Para evitar que registros malformados persistan en la lista de selección, se recomienda ejecutar periódicamente:

```sql
-- Limpiar contactos con errores tipográficos (B vs C)
DELETE FROM campaign_contact WHERE email ILIKE '%unicobnc%';

-- Eliminar correos del doctor de la lista de difusión externa
DELETE FROM campaign_contact WHERE email = 'milanopabloe@gmail.com';
```

---
*Ultima actualización: 01/04/2026 - Sistema validado para Producción Local.*
