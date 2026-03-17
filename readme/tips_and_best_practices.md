# Tips y Buenas Prácticas de Desarrollo y Operaciones

Este documento recopila lecciones aprendidas durante la resolución de incidentes críticos para optimizar futuras intervenciones.

## 1. Ejecución de SQL vía SSH Bridge (`ssh_runner.py`)

Al usar `python ssh_runner.py` para ejecutar comandos `psql` dentro de Docker, el escape de caracteres se vuelve extremadamente complejo debido a los múltiples niveles de interpretación (PowerShell -> Python Script -> SSH -> Bash en Server -> Bash en Docker -> Postgres).

### ❌ Lo que NO funciona (o da muchos problemas)
- **Comandos con `/`**: Intentar usar `LIKE '%/%'` o rutas con barras suele causar errores de `unexpected EOF`, `CommandNotFound` o el truncado silencioso del comando. El sistema interpreta la barra como un separador de ruta o escape de Shell antes de llegar a Postgres.
- **Comillas anidadas complejas**: PowerShell y Bash interpretan las comillas de forma distinta. Lo que parece bien escapado en la terminal local se rompe al pasar por SSH y luego al `docker exec`.
- **El "Bucle de Fallos"**: Es común intentar corregir el escape una y otra vez (cambiando `\"` por `\'`, añadiendo `\\`, etc.). Esto suele consumir muchas iteraciones sin éxito debido a la cantidad de capas de software involucradas.

### ✅ Lo que SÍ funciona (La Regla de Oro)
Para cualquier consulta que no sea un simple `SELECT * FROM table LIMIT 10`, **NO uses SQL directo**. En su lugar, aplica la técnica de **Fail-Fast**:

1.  **Si el comando falla a la primera**, no intentes arreglar el escape.
2.  **Crea inmediatamente un script de Python** en `backend/scripts/` (ej. `diagnose_x.py`).
3.  Usa el boilerplate estándar para conectar a la DB:
    ```python
    from app.db.base import SessionLocal
    db = SessionLocal()
    # ... tu lógica aquí ...
    db.close()
    ```
4.  Sincroniza y ejecuta:
    ```bash
    python ssh_runner.py "cd /opt/appgynsys ; git pull ; docker exec ... python scripts/diagnose_x.py"
    ```

**Ventajas:**
- **Inmunidad al Escaping**: El código SQL vive dentro del string de Python, protegido de las capas de Shell.
- **Resultados Estructurados**: Puedes procesar datos complejos y escupir JSON limpio.
- **Auditabilidad**: El diagnóstico queda guardado como código en el repositorio.

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
