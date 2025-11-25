# 📝 Crear Migración para photo_url

## Pasos para Agregar el Campo photo_url

### 1. Detener el Backend
Presiona Ctrl+C en la terminal donde está corriendo uvicorn.

### 2. Crear la Migración
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
alembic revision --autogenerate -m "Add photo_url to doctors"
```

### 3. Aplicar la Migración
```powershell
alembic upgrade head
```

### 4. Reiniciar el Backend
```powershell
uvicorn app.main:app --reload
```

---

## ✅ Después de la Migración

El campo `photo_url` estará disponible en:
- El modelo `Doctor`
- Los schemas `DoctorInDB` y `DoctorPublic`
- El endpoint de actualización `/api/v1/users/me`

---

## 📸 Para Subir las Imágenes

### Opción 1: Servicio de Hosting
- Imgur
- Cloudinary
- AWS S3
- O cualquier servicio de hosting de imágenes

### Opción 2: Almacenamiento Local
- Guardar en `backend/uploads/`
- Servir desde el backend (requiere configuración adicional)

