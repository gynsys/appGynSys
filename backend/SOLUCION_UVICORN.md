# 🔧 Solución: uvicorn no se reconoce

## ❌ Problema
El script activa el entorno virtual pero uvicorn no está instalado.

## ✅ Solución: Instalar Dependencias Manualmente

### Paso 1: Abrir Terminal
Abre PowerShell o CMD.

### Paso 2: Ir al Directorio del Backend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
```

### Paso 3: Activar Entorno Virtual
```powershell
..\..\gynsys\venv\Scripts\activate
```

Deberías ver `(venv)` al inicio de la línea.

### Paso 4: Instalar Dependencias
```powershell
pip install -r requirements.txt
```

Esto puede tardar 2-3 minutos. Instalará:
- FastAPI
- uvicorn
- SQLAlchemy
- Alembic
- Y todas las demás dependencias

### Paso 5: Verificar Instalación
```powershell
python -c "import uvicorn; print('uvicorn OK')"
```

Si muestra "uvicorn OK", está instalado.

### Paso 6: Crear Base de Datos
```powershell
alembic upgrade head
```

### Paso 7: Iniciar Servidor
```powershell
uvicorn app.main:app --reload
```

Deberías ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## ✅ Después de Instalar

1. El servidor estará en: http://localhost:8000
2. La documentación en: http://localhost:8000/docs
3. El frontend podrá conectarse al backend

---

## 📝 Comandos Completos (Copia y Pega)

```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

---

## ⚠️ Si Hay Errores

### Error: "pip no se reconoce"
- Verifica que el entorno virtual esté activado (deberías ver `(venv)`)
- Prueba: `python -m pip install -r requirements.txt`

### Error: "Permission denied"
- Ejecuta PowerShell como Administrador
- O usa: `pip install --user -r requirements.txt`

### Error al instalar alguna dependencia
- Actualiza pip: `python -m pip install --upgrade pip`
- Intenta de nuevo: `pip install -r requirements.txt`

