# Tips y Buenas Prácticas de Desarrollo y Operaciones

Este documento recopila lecciones aprendidas durante la resolución de incidentes críticos para optimizar futuras intervenciones.

## 1. Ejecución de SQL vía SSH Bridge (`ssh_runner.py`)

Al usar `python ssh_runner.py` para ejecutar comandos `psql` dentro de Docker, el escape de caracteres se vuelve extremadamente complejo debido a los múltiples niveles de interpretación (PowerShell -> Python Script -> SSH -> Bash en Server -> Bash en Docker -> Postgres).

### ❌ Lo que NO funciona (o da muchos problemas)
- **Comandos con `/`**: Intentar usar `LIKE '%/%'` o rutas con barras suele causar errores de `unexpected EOF` o truncado de comandos.
- **Comillas anidadas complejas**: PowerShell y Bash interpretan las comillas de forma distinta, lo que rompe la cadena del comando SQL.

### ✅ Lo que SÍ funciona (Recomendado)
Para consultas complejas, **NO uses SQL directo** en la línea de comandos. En su lugar:

1.  **Crea un script de Python temporal** en `backend/scripts/` (ej. `temp_query.py`).
2.  Usa los modelos de SQLAlchemy para realizar la consulta.
3.  Sincroniza el script vía Git o `scp`.
4.  Ejecútalo con:
    ```bash
    python ssh_runner.py "docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python scripts/temp_query.py"
    ```

**Ventajas:**
- Evitas problemas de escaping.
- Puedes formatear la salida como JSON para facilitar la lectura.
- El script queda como referencia para el futuro.

---

## 2. Conflictos de Dispositivo: Doctor vs Paciente

El sistema SaaS permite que un usuario tenga múltiples roles (Inquilino/Doctor y Paciente en "Mi Ciclo").

### 🚩 El Problema
Por defecto, el registro de tokens push usaba un `UPSERT` que sobrescribía el dueño del dispositivo. Si la Dra. Mariel entraba a "Mi Ciclo" como paciente, su dispositivo dejaba de estar vinculado a su cuenta de doctora, perdiendo las notificaciones médicas.

### 🛠 La Solución (Implementada Mar-2026)
Se implementó un **Smart UPSERT** en el backend. 
- El sistema ahora intenta **fusionar** las identidades.
- Si un dispositivo ya tiene un `doctor_id` y recibe una suscripción de un `user_id`, mantiene AMBOS.
- Esto permite que el médico use ambas facetas de la plataforma en el mismo teléfono.

### 💡 Recomendación Operativa
Si un médico reporta que dejó de recibir notificaciones tras usar "Mi Ciclo":
1.  Verificar suscripciones con `scripts/diagnose_appointments.py --subs-only`.
2.  Si el `doctor_id` está vacío pero el `user_id` tiene datos, pedirle que **vuelva a iniciar sesión como doctor**. El nuevo sistema Smart UPSERT restaurará el vínculo sin borrar el de paciente.
