# Sistema de Notificaciones de Campañas y Depuración de Fallas

Este documento detalla el funcionamiento del sistema de difusión de campañas de GyNSys, el diagnóstico de la falla de redirección al doctor y las medidas correctivas aplicadas el 01/04/2026.

## 1. Arquitectura del Flujo de Notificación

El sistema opera en tres capas desacopladas para garantizar escalabilidad:

### A. Capa de Expansión (`backend/app/tasks/campaigns.py`)
- Al lanzar una campaña, la tarea `process_diffusion_campaign` busca los destinatarios según el filtro (Todos, Pacientes, Usuarios App o Selección Manual).
- **Snapshot de Resiliencia**: Se crea un registro en `PendingNotification` donde se graba permanentemente el campo `recipient_email_direct`. Esto asegura que si el email de un paciente cambia después, la campaña se envíe al correo que se seleccionó originalmente.

### B. Capa de Cola (`backend/app/tasks/notifications.py`)
- Un proceso de **Celery Beat** recorre cada 60 segundos la tabla `pending_notifications`.
- Selecciona los registros con estado `pending` y los envía al procesador central.

### C. Capa de Entrega (`backend/app/services/notifications/sender.py`)
- Es el cerebro que decide a dónde va el correo y el Push.
- Utiliza `_send_integrated_email` para despachar vía **Resend** (API) o **SMTP** (Gmail).

---

## 2. Diagnóstico de la Falla: "La Sombra del Doctor"

### El Problema
Los correos de campaña dirigidos a suscriptores externos (ej. `unicobnb20@gmail.com`) estaban llegando al buzón de la doctora (`milanopabloe@gmail.com`).

### Causas Raíz Identificadas
1.  **Prioridad de Perfil (Falla de Jerarquía)**: La lógica del `sender.py` priorizaba el `recipient_id` (el ID interno de la App) sobre el `recipient_email_direct` (el email escrito). Como muchos registros de prueba compartían el mismo ID de usuario o estaban mal mapeados, el sistema consultaba el perfil y encontraba el email de la doctora, enviándolo ahí e ignorando el email de la campaña.
2.  **Fallback Administrativo**: Existía una regla de "Última Opción" que redirigía cualquier notificación sin destinatario claro al correo del doctor. En condiciones de error, esto inundaba el buzón del inquilino con ruido.
3.  **Falsos Positivos ("Fake Sent")**: El sistema marcaba las notificaciones como `sent` incluso si el servidor de correo reportaba un fallo, ocultando errores de entrega o redirecciones.

---

## 3. Acciones Correctivas Realizadas

### [BACKEND] Inversión de Prioridad Directa
Se modificó `sender.py` para aplicar la jerarquía **"Direct Email First"**:
- **PASO 1**: Usar `recipient_email_direct` si existe (Snapshot de campaña). **PRIORIDAD ABSOLUTA**.
- **PASO 2**: Usar email de perfil de usuario (`CycleUser`) solo si no hay email directo.
- **PASO 3**: Bloqueo total del fallback al doctor si la notificación tiene un destinatario definido.

### [BACKEND] Validación Real de Envío
Se actualizó el despachador para capturar el valor booleano de éxito de los servicios SMTP/Resend. Ahora, si el correo no sale, el estado es `failed` y se registra el error técnico específico.

### [FRONTEND] Prioridad de Selección
Se rediseñó la lógica de envío en la UI para que, si el usuario hace clic en los checkboxes de la lista (Selección Manual), el sistema ignore la pestaña activa (ej. "Pacientes") y envíe **exclusivamente** a los seleccionados, evitando envíos masivos accidentales.

### [DATA] Limpieza de Contactos
Se realizó un **Hard Delete** de registros erróneos (ej. `unicobnc20` con C) para eliminar duplicados y confusiones visuales en el panel.

---

## 4. Estado Actual y Recomendaciones
- El sistema es ahora **resiliente al cambio de emails**: una vez lanzada la campaña, el destinatario queda "bloqueado".
- **Monitoreo en Resend**: Se recomienda verificar periódicamente el dashboard de Resend, ya que si un correo aparece como "Suppressed", el sistema GynSys ahora lo marcará como `failed` correctamente.

---
*Documentación generada para garantizar la continuidad del soporte técnico y evitar regresiones en el módulo de difusión.*
