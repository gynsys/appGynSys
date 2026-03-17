# 🚨 Guía de Diagnóstico de Crisis (502 / CORS / Crashes)

Esta guía detalla el procedimiento para resolver errores críticos de conectividad y caídas del backend detectados durante la implementación de la v22.

## 1. Síntomas Comunes
*   **Error 502 Bad Gateway**: Nginx no puede comunicarse con el backend (puerto 8000).
*   **Bloqueo por CORS**: Mensajes en consola del navegador indicando que falta la cabecera `Access-Control-Allow-Origin`. 
    *   *Nota*: Si el backend está caído (502), Nginx devuelve una página de error propia que NO tiene CORS, causando este mensaje de distracción. **Primero arregla el 502.**

## 2. Procedimiento de Diagnóstico

### Paso A: Verificar estado de contenedores
Ejecuta esto para ver si el backend se está reiniciando constantemente (Boot loop):
```bash
python ssh_runner.py "docker ps"
```
Si el estado es `Restarting` o `Up (0 seconds)`, el backend está crasheando al iniciar.

### Paso B: Extraer logs de error de arranque
Los errores de Python (NameError, ImportError, Pydantic Validation) suelen salir por el canal `stderr`. Usa redirección para capturarlos:
```bash
python ssh_runner.py "docker logs --tail 50 appgynsys-backend-1 2>&1"
```
**Busca líneas como:**
*   `NameError: name 'XYZ' is not defined` -> Falta un import.
*   `pydantic.error_wrappers.ValidationError` -> El `.env` o el JSON de entrada está mal.

## 3. Soluciones Rápidas

### Caso 1: Error de Código (NameError/Import)
1. Corregir el código localmente.
2. `git add . && git commit -m "fix: ..." && git push origin main`
3. En el servidor:
   ```bash
   python ssh_runner.py "cd /opt/appgynsys && git pull origin main && docker compose restart backend"
   ```

### Caso 2: Error de CORS Persistente (Servidor Vivo)
Si el servidor responde 200 OK pero sigue habiendo errores de CORS:
1. Revisa `backend/app/main.py`.
2. Asegura que `CORSMiddleware` sea el **último** middleware añadido (o el más externo).
3. Verifica que `settings.CORS_ORIGINS` no tenga barras diagonales `/` al final.

## 4. Comandos de Verificación Final
Una recuperación exitosa debe mostrar estos logs:
```text
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Para probar la conectividad desde fuera:
```bash
curl -I https://api.gynsys.net/api/v1/notifications/rules
```
Debe devolver `HTTP/1.1 200 OK`.
