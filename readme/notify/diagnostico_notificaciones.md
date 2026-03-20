# Diagnóstico de Notificaciones (Persistente)

Este documento centraliza el proceso de depuración del sistema de notificaciones para evitar repetir investigaciones desde cero.

## 🛠 Herramienta Unificada V2
El script definitivo se encuentra en `readme/diagnose_unified.py`. Es una herramienta inteligente que detecta si el email pertenece a una **Doctora** o a una **Usuaria (Mi Ciclo)** y aplica el diagnóstico correspondiente.

> [!TIP]
> **¿Notificaciones sin cuerpo o vacías?** Consulta la [Guía de Diagnóstico Rápido](guia_diagnostico_rapido.md) y usa el script unificado de backend para una solución inmediata.

### 🚀 Cómo ejecutarlo

Hay dos formas dependiendo de dónde estés:

#### A. Desde tu computadora (Local Windows)
Usa el `ssh_runner.py` para que él se encargue de entrar al servidor por ti:
```bash
python ssh_runner.py "docker exec appgynsys-backend-1 python3 app/scripts/diagnose_unified.py --email <email>"
```

#### B. Directamente en el Servidor (Consola root@ubuntu)
Si ya estás dentro del servidor vía SSH, no necesitas el `ssh_runner.py`. Corre el comando de Docker directamente:
```bash
docker exec -it appgynsys-backend-1 python3 app/scripts/diagnose_unified.py --email <email>
```

### 📋 Tipos de Notificación Comunes:
- `doctor_new_appointment`
- `doctor_preconsulta_completed`
- `doctor_new_contact_message`
- `doctor_new_online_consultation`
- `doctor_daily_agenda`

## 🧠 Lógica de Notificaciones (Actualizada 2026-03-16)

A partir de marzo de 2026, el sistema se simplificó para garantizar estabilidad en un entorno SaaS multiusuario:

1.  **Fuente Única de Verdad (Single Source of Truth)**: Se eliminaron las reglas específicas por doctor (`tenant_id`). Ahora **todas** las notificaciones usan las plantillas globales administradas por el Super Admin.
2.  **Sincronización Push/Email**: Las notificaciones Push ahora heredan automáticamente el texto de la plantilla de Email (limpiando tags HTML) si no hay un texto plano específico. Esto evita que la App muestre mensajes viejos mientras el correo muestra los nuevos.
3.  **Variables Dinámicas**: Aunque la plantilla es global, variables como `{doctor_name}`, `{patient_name}`, etc., se llenan en tiempo real según el inquilino que dispara el evento.

## 🔍 Puntos de Verificación Críticos

1.  **Reglas Globales**: Verificar que el cambio se hizo en la regla con `tenant_id IS NULL` en la tabla `notification_rules`.
2.  **Suscripciones**: Si no hay suscripciones activas (verificable con `--subs-only`), el usuario NUNCA recibirá push.
3.  **Cierre de Sesión**: Si un cambio de texto no se refleja en la App pero sí en el servidor, pedir al médico que cierre sesión y vuelva a entrar para refrescar el token de vinculación.

- **2026-03-16**: **Conflicto "Mi Ciclo" vs Doctor**. Se detectó que si un médico usa el mismo dispositivo para loguearse como paciente en la App "Mi Ciclo", el token de push se reasigna al `user_id` del paciente y se elimina el `doctor_id`. 
    - **Síntoma**: El médico deja de recibir notificaciones en ese teléfono.
    - **Solución**: Cerrar sesión en "Mi Ciclo" y volver a entrar como Doctor. Para prevenir esto, se recomienda no usar cuentas de paciente en dispositivos de trabajo médico o alternar sesiones con precaución.
- **2026-03-17**: **Diagnóstico Usuaria 'Likeme' (Método del Ritmo)**. Se confirmó que el sistema opera correctamente. La falta de notificaciones se debió a que la usuaria no tenía dispositivos móviles vinculados durante los días de infertilidad. Las notificaciones llegaron por Email exitosamente.
- **2026-03-15**: Falla crítica tras reinicio de Droplet...
- **2026-03-12**: Investigando falla masiva en APK. Se detectó falta de columna `token` en producción y error 500 en auditoría. Solucionado.

---

## 📅 Lógica: Método del Ritmo (10 Reglas)

El método del ritmo dispara exactamente **10 notificaciones** por ciclo para advertir sobre los días de infertilidad:

1.  **Días Post-Periodo (5)**: `rhythm_after_period_1` hasta `5`. Se disparan consecutivamente después de que termina el periodo.
2.  **Días Pre-Periodo (5)**: `rhythm_before_period_5` hasta `1`. Se disparan en cuenta regresiva antes de la fecha estimada del próximo periodo.

### 💡 Por qué "sent" no siempre llega:
En los logs, puedes ver un registro como `sent` pero que el usuario no vea nada. Esto ocurre cuando:
- La usuaria recibe la notificación por **Email** (éxito), pero el **Push** falló porque no hay dispositivo vinculado.
- Como el sistema es **DUAL**, si uno de los dos canales (Email) funciona, el estado global se marca como exitoso. Siempre verificar la columna `channel_used` y los errores en `NotificationLog`.

## 🛠 Tips Técnicos de Diagnóstico (Docker)

Si necesitas correr un script de Python rápido para consultar la base de datos dentro del contenedor:

1.  **Manejo de Imports**: Siempre agrega `/app` al `sys.path`.
2.  **SessionLocal**: En este proyecto, `SessionLocal` suele inicializarse dinámicamente en los scripts de utilidad.
3.  **Comando de Emergencia**:
```bash
docker exec -i appgynsys-backend-1 python3 -c "
import sys; sys.path.append('/app')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.cycle_user import CycleUser

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
# ... tu lógica aquí ...
db.close()
"
```
