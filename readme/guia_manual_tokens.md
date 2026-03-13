# Guía Rápida: Vinculación Manual de Tokens Push

Para evitar iteraciones y depuraciones innecesarias, aquí tienes el método directo para inyectar un token en la base de datos.

## 1. El Comando Maestro (SQL Directo)

Si tienes acceso a la terminal y quieres hacerlo de un solo golpe, usa estos comandos (reemplaza `[TOKEN]` y `[SLUG/EMAIL]`):

### Para un Doctor (Inquilino)
```powershell
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"INSERT INTO push_subscriptions (doctor_id, token, updated_at) SELECT id, '[TOKEN]', NOW() FROM doctors WHERE slug_url = '[SLUG]' ON CONFLICT (token) DO UPDATE SET doctor_id = EXCLUDED.doctor_id, updated_at = EXCLUDED.updated_at;\""
```

### Para un Paciente (Usuario)
```powershell
python ssh_runner.py "docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"INSERT INTO push_subscriptions (user_id, token, updated_at) SELECT id, '[TOKEN]', NOW() FROM cycle_users WHERE email = '[EMAIL]' ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at;\""
```

---

## 2. Usando el Script de Ayuda

He creado un script en `backend/scripts/link_token_helper.py` que genera el comando exacto para ti para que no tengas que pelear con las comillas.

**Uso:**
```powershell
python backend/scripts/link_token_helper.py --type doctor --id mariel-herrera --token fqgpFReoTA...
```

**Resultado:** El script te imprimirá el comando `python ssh_runner.py ...` listo para copiar y pegar.

---

## 3. ¿Por qué esto es mejor?
- **Atómico:** Si el token ya existe, lo actualiza (UPSERT). Si no, lo crea.
- **Seguro:** Busca el ID internamente por slug o email, evitando que tengas que buscar IDs manualmente.
- **Directo:** Salta toda la lógica de la App y va directo al "corazón" (la base de datos).

> [!TIP]
> Usa siempre este método si necesitas validar si las notificaciones llegan a un teléfono específico sin depender de que el usuario inicie sesión correctamente en la App.
