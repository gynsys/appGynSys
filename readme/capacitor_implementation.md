# Implementación de App Nativa (Capacitor) y Debugging de Push

Este documento detalla el proceso de empaquetado de la PWA GynSys en una App nativa Android usando Capacitor, los desafíos encontrados y el estado actual de las notificaciones push.

## 🚀 Resumen del Proyecto
El objetivo es ofrecer una experiencia de App nativa (APK) manteniendo el mismo código base de la PWA. Se utilizó **Capacitor 6.0** para crear el wrapper.

## 🛠 Cambios Realizados

### 1. Detección del Entorno (Frontend)
El mayor desafío fue que el WebView de Android se identificaba como un navegador móvil estándar, impidiendo que el código React supiera cuándo activar las APIs de Capacitor (Push Notifications).

- **Solución**: Modificación del User Agent en `MainActivity.java` de Android para incluir el sufijo `GynSysApp/Capacitor`.
- **Utilidad**: Permite usar `navigator.userAgent.includes('Capacitor')` de forma síncrona y fiable.

### 2. Infraestructura de Notificaciones (Backend)
Se actualizó la base de datos y el servicio de notificaciones para soportar tokens de Firebase (FCM) usados por Capacitor, además de los endpoints de Web Push tradicionales.

- **Cambio crítico**: Se añadió la columna `token` a la tabla `push_subscriptions` en producción.
  ```sql
  ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS token VARCHAR;
  ```

## 🔍 Comandos de Diagnóstico Útiles (vía SSH)

### Ver logs de User Agent (Detección de App/Móvil)
```bash
python ssh_runner.py "docker logs appgynsys-backend-1 2>&1 | grep UA-DEBUG"
```

### Consultar registros de dispositivos (SQL)
```bash
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c 'SELECT id, doctor_id, token, created_at FROM push_subscriptions ORDER BY created_at DESC LIMIT 10;'"
```

### Limpiar caché de PWA/App (Servidor)
```bash
python ssh_runner.py "cd /opt/appgynsys && git fetch origin && git reset --hard origin/main && docker compose restart backend"
```

## ⚠️ Bloqueos y Problemas Encontrados

| Problema | Causa | Solución Aplicada |
| :--- | :--- | :--- |
| **Error 500 / CORS** | El panel de auditoría fallaba al procesar dispositivos sin `endpoint` (móviles). | Validación de nulidad en `push_test.py`. |
| **App no recibe Push** | La base de datos de producción no tenía la columna `token`. | `ALTER TABLE` manual ejecutado en el contenedor DB. |
| **Código antiguo** | El Service Worker o la caché de la App bloqueaban las actualizaciones de código. | Incremento de versión en `vite.config.js` y reinstalación de APK. |

## 🚧 Estado Actual (Pausa)
Se ha decidido pausar la depuración de la App nativa para priorizar la estabilidad de las **notificaciones Push en la PWA**. 

**Observación**: El sistema ahora es capaz de registrar dispositivos nativos, pero la coexistencia de PWA y App en el mismo dispositivo puede generar duplicidad de tokens o confusión en la base de datos si no se limpian los registros obsoletos.
