# Guía de Solución de Problemas y Errores Comunes

## 1. El Recordatorio no se envía
### Posible Causa: Celery no está procesando la tarea.
**Diagnóstico:** Ver los logs de Celery en el servidor.
**Comando:**
```powershell
python ssh_runner.py "journalctl -u celery -n 100"
```
**Solución:** Asegurarse de que la tarea esté registrada en `celery_app.py` y que el worker se haya reiniciado tras el despliegue.

### Posible Causa: Email del paciente es inválido.
**Diagnóstico:** Revisar la columna `patient_email` en la tabla `scheduled_appointments`.
**Solución:** Validar el formato del email en el frontend antes del envío. Si es nulo, el sistema debe intentar enviar solo la notificación Push.

## 2. Error al Guardar la Consulta (POST 500)
### Posible Causa: El médico no tiene ID asignado.
**Diagnóstico:** Revisar el payload enviado desde `DoctorConsultationPage.jsx`.
**Solución:** Cambiar el `doctor_id: 1` hardcodeado por el ID dinámico del médico logueado.

### Posible Causa: Formato de fecha incorrecto.
**Diagnóstico:** La base de datos espera un objeto `DateTime` con zona horaria.
**Solución:** Usar `.toISOString()` en el frontend antes de enviar el payload.

## 3. Citas Duplicadas
### Posible Causa: El médico presionó "Guardar" varias veces.
**Diagnóstico:** Múltiples entradas para la misma `original_consultation_id`.
**Solución:** Deshabilitar el botón de guardado en el frontend mientras la petición está en curso (`isSaving`).

## 4. Problemas de SSH / Despliegue
### Error: `ssh_runner.py` no conecta.
**Diagnóstico:** Verificar la ruta de la llave privada en el script (`id_ed25519`).
**Solución:** Asegurarse de que el puerto 22 esté abierto en el servidor y que la IP `167.172.115.154` sea la correcta.
