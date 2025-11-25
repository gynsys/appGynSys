# 📦 Instalar Dependencias del Backend

## ❌ Problema
"uvicorn no se reconoce" - Las dependencias del backend no están instaladas.

## ✅ Solución

### Opción 1: Usar el Script Actualizado (Recomendado)

El script `start_backend.bat` ahora detecta e instala dependencias automáticamente.

1. **Cierra** la ventana actual
2. **Abre una nueva terminal**
3. Ejecuta:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\backend
   start_backend.bat
   ```
4. El script instalará las dependencias automáticamente

---

### Opción 2: Instalar Manualmente

1. **Abre PowerShell o CMD**
2. Activa el entorno virtual:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\backend
   ..\..\gynsys\venv\Scripts\activate
   ```
3. Instala las dependencias:
   ```powershell
   pip install -r requirements.txt
   ```
4. Esto puede tardar 2-3 minutos
5. Cuando termine, inicia el servidor:
   ```powershell
   uvicorn app.main:app --reload
   ```

---

## 📝 Comandos Completos

```powershell
# 1. Ir al directorio
cd C:\Users\pablo\Desktop\appgynsys\backend

# 2. Activar entorno virtual
..\..\gynsys\venv\Scripts\activate

# 3. Instalar dependencias (solo la primera vez)
pip install -r requirements.txt

# 4. Crear base de datos
alembic upgrade head

# 5. Iniciar servidor
uvicorn app.main:app --reload
```

---

## ✅ Verificar Instalación

Después de instalar, verifica:

```powershell
python -c "import uvicorn; print('OK')"
python -c "import fastapi; print('OK')"
python -c "import sqlalchemy; print('OK')"
```

Si todos muestran "OK", las dependencias están instaladas.

---

## 🚀 Después de Instalar

1. El servidor debería iniciar correctamente
2. Verás: "Uvicorn running on http://127.0.0.1:8000"
3. Abre: http://localhost:8000/docs
4. ✅ Deberías ver la documentación de Swagger

---

## ⚠️ Si Hay Errores

### Error: "pip no se reconoce"
- Asegúrate de estar en el entorno virtual
- Verifica que Python esté instalado: `python --version`

### Error: "Permission denied"
- Ejecuta PowerShell como Administrador
- O usa: `pip install --user -r requirements.txt`

### Error al instalar alguna dependencia
- Actualiza pip: `python -m pip install --upgrade pip`
- Intenta de nuevo: `pip install -r requirements.txt`

