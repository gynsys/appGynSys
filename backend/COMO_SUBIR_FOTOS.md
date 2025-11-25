# 📸 Cómo Subir Fotos y Logos

## 🎯 Método 1: Desde el Dashboard (Más Fácil)

### Paso 1: Iniciar Sesión
1. Ve a: http://localhost:5173/login
2. Inicia sesión con tu cuenta de médico

### Paso 2: Ir a Editar Perfil
1. Ve al dashboard: http://localhost:5173/dashboard
2. Click en "Editar Perfil" en el menú superior
3. O ve directamente a: http://localhost:5173/dashboard/profile

### Paso 3: Subir Logo
1. En la sección "Logo", click en "Elegir archivo"
2. Selecciona tu logo (formato: JPEG, PNG, WebP, máximo 5MB)
3. Verás una vista previa
4. Click en "Subir Logo"
5. ✅ El logo se actualizará automáticamente

### Paso 4: Subir Foto
1. En la sección "Foto de Perfil", click en "Elegir archivo"
2. Selecciona tu foto profesional
3. Verás una vista previa circular
4. Click en "Subir Foto"
5. ✅ La foto se actualizará automáticamente

### Paso 5: Actualizar Biografía
1. En "Biografía", pega el texto de `BIografia_DRA_MARIEL.md`
2. Actualiza otros campos si es necesario
3. Click en "Guardar Cambios"

---

## 🎯 Método 2: Desde la API (Swagger)

### Paso 1: Obtener Token
1. Ve a: http://localhost:8000/docs
2. Usa `POST /api/v1/auth/token` para obtener tu token
3. Click en "Authorize" (🔒) y pega el token

### Paso 2: Subir Logo
1. Busca `POST /api/v1/uploads/logo`
2. Click en "Try it out"
3. En "file", selecciona tu logo
4. Click en "Execute"
5. Copia la `logo_url` que retorna

### Paso 3: Subir Foto
1. Busca `POST /api/v1/uploads/photo`
2. Click en "Try it out"
3. En "file", selecciona tu foto
4. Click en "Execute"
5. Copia la `photo_url` que retorna

### Paso 4: Actualizar Perfil
1. Usa `PUT /api/v1/users/me`
2. Envía:
```json
{
  "biografia": "Texto de la biografía...",
  "logo_url": "URL_del_logo",
  "photo_url": "URL_de_la_foto",
  "theme_primary_color": "#D946EF"
}
```

---

## 📁 Ubicación de los Archivos

Los archivos se guardan en:
- **Backend:** `backend/uploads/logos/` y `backend/uploads/photos/`
- **URLs:** `http://localhost:8000/uploads/logos/...` y `http://localhost:8000/uploads/photos/...`

---

## ✅ Verificar que Funciona

1. **Reinicia el backend** después de crear la migración
2. **Ve a tu perfil público:** http://localhost:5173/dr/{tu-slug}
3. **Verifica:**
   - ✅ Logo aparece en el header
   - ✅ Foto aparece en la sección "Sobre Mí"
   - ✅ Biografía se muestra correctamente

---

## 🐛 Solución de Problemas

### Error: "Invalid file type"
- Asegúrate de que el archivo sea JPEG, PNG o WebP
- Verifica la extensión del archivo

### Error: "File too large"
- El máximo es 5MB
- Comprime la imagen si es necesario

### Error: "No such file or directory"
- Verifica que el directorio `uploads/` exista
- El backend lo crea automáticamente, pero si hay error, créalo manualmente

### Las imágenes no se muestran
- Verifica que el backend esté corriendo
- Verifica que la URL sea correcta (debe empezar con `/uploads/`)
- Verifica CORS si las imágenes están en otro dominio

