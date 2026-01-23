# Cómo Subir Imágenes a la Galería

## Introducción

El sistema de galería permite a los doctores mostrar imágenes en dos ubicaciones diferentes de su perfil:

1. **Hero Slider** (carrusel principal en la parte superior del home)
2. **Sección de Galería de Trabajo** (galería completa más abajo en la página)

## Almacenamiento de Imágenes

Las imágenes se almacenan en dos lugares:
- **Archivos físicos**: En la carpeta `backend/uploads/gallery/`
- **Metadata (información)**: En la base de datos (tabla `gallery_images`)

Esto es el funcionamiento normal y correcto del sistema. **No es un error** que los archivos estén en una carpeta.

## Cómo Subir Imágenes

### Paso 1: Acceder al Admin Panel

1. Inicia sesión con tu cuenta de doctor
2. Ve al panel de administración
3. Busca la sección "Gallery Manager" o "Gestor de Galería"

### Paso 2: Subir una Nueva Imagen

1. Haz clic en "Upload Image" o "Subir Imagen"
2. Selecciona el archivo de imagen (JPEG, PNG o WebP)
3. **Opcional**: Agrega un título
4. **Opcional**: Agrega una descripción
5. Haz clic en "Upload" o "Subir"

### Paso 3: Configurar la Imagen

Después de subir la imagen, puedes editarla para configurar:

#### Para que aparezca en el Hero Slider:
✅ **Título**: REQUERIDO - La imagen necesita un título para aparecer en el slider
✅ **Featured**: REQUERIDO - Marca la casilla "Featured" o "Destacada"
✅ **Descripción**: Opcional pero recomendado

#### Para que aparezca solo en la Galería de Trabajo:
- No marques "Featured"
- El título y descripción son opcionales

## Requisitos Técnicos

### Formatos Aceptados
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Tamaño Máximo
- Depende de la configuración del servidor (generalmente 5-10 MB)

### Recomendaciones de Resolución
- **Hero Slider**: Mínimo 1920x800 px (proporción 16:9 o similar)
- **Galería**: Mínimo 1200x800 px

## Hero Slider - Requisitos Especiales

Para que una imagen aparezca en el Hero Slider del home, debe cumplir:

1. ✅ **Tener un título** (campo `title` no vacío)
2. ✅ **Estar marcada como Featured** (`featured = true`)
3. ✅ **Estar activa** (`is_active = true`)

El Hero Slider mostrará hasta 5 imágenes que cumplan estos criterios.

## Gestión de Imágenes

### Editar una Imagen
1. En el Gallery Manager, busca la imagen
2. Haz clic en "Edit" o "Editar"
3. Modifica título, descripción, o marca/desmarca "Featured"
4. Guarda los cambios

### Eliminar una Imagen
1. En el Gallery Manager, busca la imagen
2. Haz clic en "Delete" o "Eliminar"
3. Confirma la eliminación

**Nota**: Al eliminar una imagen, se elimina tanto el registro de la base de datos como el archivo físico.

### Reemplazar una Imagen
1. En el Gallery Manager, busca la imagen
2. Haz clic en "Replace Image" o "Reemplazar Imagen"
3. Selecciona el nuevo archivo
4. El título y descripción se mantienen, solo cambia la imagen

## Orden de Visualización

Las imágenes aparecen ordenadas por:
1. `display_order` (orden personalizado)
2. `created_at` (fecha de creación)

Puedes cambiar el orden en el Gallery Manager arrastrando las imágenes o editando el campo `display_order`.

## Solución de Problemas

### Las imágenes no aparecen en el Hero Slider

**Verifica que:**
1. ✅ La imagen tenga un título
2. ✅ La imagen esté marcada como "Featured"
3. ✅ La imagen esté activa (`is_active = true`)

### Las imágenes no cargan (error 404)

**Posibles causas:**
1. El archivo físico fue eliminado de la carpeta `uploads/gallery/`
2. Los permisos de la carpeta no permiten leer los archivos

**Solución:**
1. Ejecuta el script de limpieza: `python cleanup_orphaned_gallery.py`
2. Vuelve a subir las imágenes

### Error al subir imágenes

**Verifica que:**
1. El formato del archivo sea válido (JPEG, PNG, WebP)
2. El tamaño del archivo no exceda el límite
3. Tengas suficiente espacio en disco
4. La carpeta `uploads/gallery/` exista y tenga permisos de escritura

## Script de Limpieza

Si tienes imágenes en la base de datos que referencian archivos que no existen, ejecuta:

```bash
cd backend
python cleanup_orphaned_gallery.py
```

Este script:
1. Busca registros de imágenes en la base de datos
2. Verifica si el archivo físico existe
3. Te pregunta si quieres eliminar los registros huérfanos
4. Limpia la base de datos

## Ejemplo Completo

### Configurar 5 imágenes para el Hero Slider

1. Sube 5 imágenes (mínimo 1920x800 px cada una)
2. Edita cada imagen:
   - Imagen 1:
     - Título: "Atención Médica Personalizada"
     - Descripción: "Consultas especializadas en ginecología"
     - Featured: ✅ Sí
   - Imagen 2:
     - Título: "Tecnología de Vanguardia"
     - Descripción: "Equipos modernos para diagnóstico"
     - Featured: ✅ Sí
   - (Continúa con las 3 imágenes restantes)
3. Guarda los cambios
4. Visita tu perfil público para ver el slider en acción

### Agregar imágenes a la Galería de Trabajo

1. Sube tantas imágenes como desees
2. Featured: ❌ No (desmarcado)
3. Título y descripción: Opcional
4. Las imágenes aparecerán en la sección "Galería de Trabajo"
