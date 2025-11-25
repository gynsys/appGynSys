# 📝 Crear Migración para Testimonials y Gallery

## Pasos para Agregar las Nuevas Tablas

### 1. Detener el Backend
Presiona Ctrl+C en la terminal donde está corriendo uvicorn.

### 2. Crear la Migración
```powershell
cd C:\Users\pablo\Desktop\appgynsys\backend
..\..\gynsys\venv\Scripts\activate
alembic revision --autogenerate -m "Add testimonials and gallery tables"
```

### 3. Revisar la Migración
Abre el archivo generado en `alembic/versions/` y verifica que incluya:
- Tabla `testimonials` con todos los campos
- Tabla `gallery_images` con todos los campos
- Foreign keys a la tabla `doctors`

### 4. Aplicar la Migración
```powershell
alembic upgrade head
```

### 5. Reiniciar el Backend
```powershell
uvicorn app.main:app --reload
```

---

## ✅ Después de la Migración

Las nuevas tablas estarán disponibles:
- `testimonials` - Para testimonios de pacientes
- `gallery_images` - Para imágenes de la galería

---

## 📝 Notas

- Los testimonios requieren aprobación del médico (`is_approved`)
- Los testimonios pueden ser destacados (`is_featured`)
- Las imágenes de galería pueden tener título y descripción
- Las imágenes de galería tienen un orden de visualización (`display_order`)

