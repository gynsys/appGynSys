# 🚀 Onboarding Unificado (Vía Rápida)

> **Propósito:** Documentar el flujo integral donde un paciente puede agendar una cita y completar su preconsulta en un solo paso conversacional.

---

## 1. Experiencia del Usuario (Chatbot)

El componente principal es `UnifiedOnboardingChat.jsx`. Este utiliza un **motor dinámico** de chatbot que orquesta dos flujos:
1. **Flujo Administrativo:** Datos básicos, especialidad, servicio, sede y selección de horario.
2. **Flujo Médico (Preconsulta):** Preguntas dinámicas configuradas por el doctor, escala de dolor visual y otros componentes especializados.

---

## 2. Flujo de Datos y Backend

Cuando el usuario finaliza el chat, se llama al endpoint POST `/api/v1/onboarding/submit/{slug}`.

### Acciones en el servidor
1. **Creación de Cita:** Registra la cita en la tabla `appointments`.
2. **Registro de Preconsulta:** Guarda las respuestas en `preconsultation_answers`.
3. **Log de Auditoría:** Registra el evento en `audit_logs`.
4. **Notificación al Doctor (Dual):** 
   - Gatilla el evento `doctor_unified_onboarding`.
   - Envía **Push** inmediato a todos los dispositivos móviles del doctor.
   - Envía **Email** de respaldo con los detalles del paciente y la cita.
5. **Invitación al Paciente:**
   - Si el email no existe en la tabla `users`, genera un token de activación.
   - Envía un email invitando al paciente a unirse a la plataforma "Mi Ciclo" para ver sus resultados y futuras citas.

---

## 3. Mantenimiento de Notificaciones

La notificación `doctor_unified_onboarding` es la 8va notificación del registro de inquilinos.

### Configuración
- **Título:** 🚀 Onboarding Unificado Finalizado
- **Placeholders disponibles:** `{patient_name}`, `{patient_email}`, `{appointment_date}`, `{appointment_time}`.
- **Sincronización:** Se sincroniza automáticamente al iniciar el backend si no existe en la base de datos.

### Visualización Admin
Aparece en el Panel de Administración bajo la pestaña "Inquilino / Doctor". Desde allí el administrador puede:
- Editar el audio/texto del mensaje.
- Desactivar la notificación globalmente.
- Cambiar el canal (Push, Email o ambos).

---

## 4. Archivos Clave
- **Frontend:** `src/modules/onboarding/UnifiedOnboardingChat.jsx`
- **Backend (API):** `app/api/v1/endpoints/onboarding.py`
- **Backend (Registry):** `app/services/notifications/doctor_registry.py`
- **Backend (Automation):** `app/services/notifications/management.py`
