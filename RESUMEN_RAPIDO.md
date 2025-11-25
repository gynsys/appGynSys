# ⚡ Resumen Rápido - GynSys

## 🚀 Iniciar el Proyecto

### Backend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
C:\Users\pablo\Desktop\gynsys\venv\Scripts\activate
uvicorn app.main:app --reload
```
**URL:** http://localhost:8000  
**Docs:** http://localhost:8000/docs

### Frontend
```powershell
cd C:\Users\pablo\Desktop\appgynsys\frontend
npm run dev
```
**URL:** http://localhost:5173

---

## 📁 Estructura Clave

```
appgynsys/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/endpoints/
│   │   └── db/models/
│   └── alembic/
└── frontend/         # React + Vite
    └── src/
        ├── pages/
        ├── components/
        └── services/
```

---

## ✅ Funcionalidades Listas

- ✅ Autenticación (JWT)
- ✅ Perfil público médico (`/dr/{slug}`)
- ✅ Dashboard básico
- ✅ Editar perfil (logo, foto, biografía)
- ✅ Agendar citas (modal)
- ✅ Testimonios (cards modernos)
- ✅ Galería (grid + lightbox)

---

## 🔧 Comandos Útiles

### Migraciones
```powershell
# Crear migración
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head
```

### Reiniciar Frontend
```powershell
# Usar script
.\REINICIAR_MANUAL.bat

# O manual
taskkill /F /IM node.exe
npm run dev
```

---

## 📝 Notas

- **Venv:** Usar el de `C:\Users\pablo\Desktop\gynsys\venv\`
- **DB:** SQLite en `backend/gynsys.db`
- **Uploads:** `backend/uploads/` servidos en `/uploads/`

---

**Ver documentación completa en:** `DOCUMENTACION_COMPLETA.md`

