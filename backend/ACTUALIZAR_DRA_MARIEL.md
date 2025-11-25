# 📝 Cómo Actualizar el Perfil de la Dra. Mariel Herrera

## Opción 1: Desde el Dashboard (Recomendado)

1. Inicia sesión en el dashboard
2. Ve a la sección de perfil
3. Actualiza:
   - **Biografía:** Copia el texto de `BIografia_DRA_MARIEL.md`
   - **Logo URL:** Sube el logo y copia la URL
   - **Photo URL:** Sube la foto y copia la URL
   - **Color Primario:** Puedes usar un color rosado que combine con el logo (ej: `#D946EF` o `#EC4899`)

## Opción 2: Desde la API (Swagger)

1. Ve a: http://localhost:8000/docs
2. Autentícate con el token de la Dra. Mariel
3. Usa el endpoint `PUT /api/v1/users/me`
4. Envía:

```json
{
  "biografia": "Soy la Dra. Mariel Herrera, Ginecólogo - Obstetra graduada de la prestigiosa Universidad Central de Venezuela (UCV), una de las instituciones médicas más reconocidas de Latinoamérica.\n\nCon años de experiencia en el campo de la ginecología y obstetricia, me especializo en el diagnóstico y tratamiento de Endometriosis, una condición que afecta a millones de mujeres en todo el mundo.\n\nMi enfoque se centra en brindar atención integral, personalizada y empática a cada una de mis pacientes, utilizando las técnicas más avanzadas y actualizadas en el campo de la medicina reproductiva y ginecológica.\n\nEstoy comprometida con la educación de mis pacientes, ayudándolas a comprender su salud reproductiva y proporcionándoles las herramientas necesarias para tomar decisiones informadas sobre su bienestar.",
  "logo_url": "URL_DEL_LOGO",
  "photo_url": "URL_DE_LA_FOTO",
  "theme_primary_color": "#D946EF"
}
```

## Opción 3: Directamente en la Base de Datos

```sql
UPDATE doctors 
SET 
  biografia = 'Soy la Dra. Mariel Herrera, Ginecólogo - Obstetra graduada de la prestigiosa Universidad Central de Venezuela (UCV)...',
  logo_url = 'URL_DEL_LOGO',
  photo_url = 'URL_DE_LA_FOTO',
  theme_primary_color = '#D946EF'
WHERE email = 'email_de_la_dra@example.com';
```

## 📸 Notas sobre las Imágenes

- **Logo:** Debe ser una imagen con fondo transparente o que combine bien con el header blanco
- **Foto:** Debe ser una foto profesional, preferiblemente cuadrada o circular
- **URLs:** Puedes subir las imágenes a un servicio de hosting o almacenarlas localmente

## 🎨 Color Sugerido

Basado en el logo (tonos rosados), sugiere usar:
- `#D946EF` (Fuchsia)
- `#EC4899` (Pink)
- `#DB2777` (Rose)

