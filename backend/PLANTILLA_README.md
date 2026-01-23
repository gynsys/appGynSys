# Plantilla de Configuración - Dra. Mariel Herrera

Esta carpeta contiene herramientas para extraer y aplicar configuraciones de perfiles médicos como plantillas reutilizables.

## ✅ Automatización SaaS Completada

**Los nuevos inquilinos se crean automáticamente con la plantilla completa de Mariel Herrera**, incluyendo:

### 🎨 Estilos CSS y Tema Visual
- **Color primario**: `#820845` (rosa/morado elegante)
- **Fondo del body**: `#f3f1f1` (gris claro)
- **Fondo de contenedores**: `#ffffff` (blanco)
- **Sombras**: Deshabilitadas para un look limpio
- **Transiciones**: Suaves animaciones CSS

### 📋 Configuración Profesional
- **Especialidad**: Ginecología y Obstetricia
- **Universidad**: Universidad Central de Venezuela
- **Biografía**: Texto completo con formato HTML
- **Título de servicios**: "Mi Servicios"
- **Email de contacto**: Configurado

### 🌐 Redes Sociales
- **Instagram**: @draendog (enlace completo)
- **TikTok**: Enlace personalizado
- **YouTube/X/Facebook**: Vacíos para personalización

### 📅 Horarios de Consulta
- **Caracas**: Martes 8am-5pm
- **Guarenas**: Sábado 8am-1pm

### 🖨️ Configuración PDF
- Información médica completa
- Ubicaciones y datos de contacto
- Configuración de reportes

### ⚙️ Módulos Habilitados
- Test de endometriosis
- Blog integrado

## 🚀 Proceso Automático

Cuando un nuevo doctor se registra en el sistema:

1. **Registro básico** → Se crea el perfil con email/contraseña
2. **Aplicación automática** → Se aplica la plantilla de Mariel
3. **Configuración completa** → Tema visual, contenido, módulos listos
4. **Activación pendiente** → Espera aprobación del admin

## ✅ Verificación Exitosa

La automatización ha sido **probada y verificada**:
- ✅ 9/9 checks pasaron en la prueba automatizada
- ✅ Todos los campos de configuración se aplican correctamente
- ✅ Nuevos inquilinos heredan el setup completo de Mariel

## Archivos

- `mariel_herrera_template.json`: Configuración completa extraída del perfil de la Dra. Mariel Herrera
- `extract_mariel_template.py`: Script para extraer configuración de un perfil y guardarla como plantilla
- `apply_mariel_template.py`: Script para aplicar plantillas a perfiles existentes
- `test_new_tenant.py`: Script para probar que los nuevos inquilinos se crean correctamente

## Uso Manual

### Extraer una nueva plantilla
```bash
python extract_mariel_template.py
```

### Aplicar plantilla a un doctor existente
```bash
python apply_mariel_template.py <doctor_slug>
```

### Probar creación automática
```bash
python test_new_tenant.py
```

## Personalización

Los nuevos doctores pueden personalizar:
- **Logo y foto**: Subir imágenes propias
- **Colores**: Modificar el tema desde el dashboard
- **Contenido**: Editar biografía, especialidad, horarios
- **Redes sociales**: Agregar sus propios enlaces
- **Módulos**: Habilitar/deshabilitar funcionalidades

## Backup Recomendado

Antes de modificar la plantilla, hacer backup:

```bash
cp mariel_herrera_template.json mariel_herrera_template_backup.json
```