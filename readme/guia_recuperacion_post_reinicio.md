# Guía de Recuperación Post-Reinicio (Droplet/Servidor)

Este procedimiento debe ejecutarse **SIEMPRE** que el servidor sea reiniciado o los contenedores Docker sean recreados, para asegurar que los servicios críticos (notificaciones, base de datos) funcionen correctamente.

## 🚀 Herramienta Automática (RECOMENDADO)
He creado un script que hace todo el trabajo por ti. Solo córrelo desde tu computadora local:
```powershell
python readme/repair_push.py
```
Este script:
1. Busca un token válido en producción.
2. Prueba si la librería existe enviando un mensaje.
3. Si falla, instala `firebase-admin` en todos los contenedores y reinicia los servicios.
4. Vuelve a probar y te confirma el resultado.

---

## 🕒 Cronograma de Verificación Manual (Fast-Track)

Si las notificaciones push no llegan, no pierdas horas. Sigue este orden exacto:

### 1. ¿Están los contenedores Celery arriba?
A veces el backend sube pero las automatizaciones no.
```bash
docker ps | grep celery
```
**Si no aparecen:** Ejecuta `docker-compose up -d`.

### 2. El "Comando de Oro" (Prueba Directa de Firebase)
Este comando salta toda la lógica del negocio y envía un mensaje directo a un token. Si este falla, el problema es **infraestructura/librerías**.

**Paso A: Obtener un token activo de la BD**
```bash
docker exec appgynsys-db-1 psql -U postgres -d gynsys -c "SELECT token FROM push_subscriptions WHERE token IS NOT NULL ORDER BY updated_at DESC LIMIT 1;"
```

**Paso B: Ejecutar envío directo (Sustituye <TOKEN>)**
```bash
docker exec -w /app -e PYTHONPATH=. appgynsys-backend-1 python -c "from scripts.test_firebase_direct import test_token_direct; test_token_direct('<TOKEN>')"
```
*   **Si falla con `ModuleNotFoundError: No module named 'firebase_admin'`**: Ve directamente al paso 3.

### 3. Verificar e Instalar Librerías Críticas (Fuerza Bruta)
Por razones de persistencia de imagen, a veces las librerías de Firebase no se cargan tras un reinicio. Ejecuta esto para asegurar:

```bash
# En el Backend
docker exec appgynsys-backend-1 pip install firebase-admin==6.4.0

# En el Worker (el que envía las automáticas)
docker exec appgynsys-celery_worker-1 pip install firebase-admin==6.4.0

# Reiniciar para aplicar
docker restart appgynsys-backend-1 appgynsys-celery_worker-1 appgynsys-celery_beat-1
```

### 4. Revisión de Logs de Error Reales
No confíes en el estado "sent" de la base de datos si el usuario no recibe nada. Mira el proceso "vivo":
```bash
docker logs --tail 100 -f appgynsys-celery_worker-1
```
*Si ves errores de Google Auth o VAPID, el problema son las llaves en el `.env`.*

## 📌 Lecciones Aprendidas (Marzo 2026)
*   **Falsos Positivos**: El backend puede registrar una notificación como `sent` porque se envió correctamente al navegador (WebPush), pero fallar en el celular (FCM) si falta la librería.
*   **Aislamiento**: Siempre prueba con `test_firebase_direct.py` primero. Si ese script funciona, el problema está en la lógica de `NotificationRule`. Si falla, es el servidor.
*   **Celery**: El contenedor `appgynsys-celery_worker-1` es el motor de los envíos. Si el worker no tiene la librería instalada, las notificaciones automáticas (Agenda Diaria) morirán en silencio.
