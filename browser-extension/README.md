# 🔍 DOM Inspector Pro - Extensión de Navegador

## Instalación Rápida (Chrome/Edge)

### Paso 1: Cargar la Extensión
1. Abre **Chrome** o **Edge**
2. Ve a la página de extensiones:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Activa el **"Modo de desarrollador"** (toggle en la esquina superior derecha)
4. Click en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta: `c:\Users\pablo\Documents\appgynsys\browser-extension`

### Paso 2: Fijar la Extensión
1. Click en el ícono de extensiones (puzzle) en la barra del navegador
2. Busca "DOM Inspector Pro"
3. Click en el ícono de **pin** 📌 para que quede visible

---

## 🚀 Cómo Usar

### Inicio Rápido
1. Ve a tu aplicación: `http://localhost:5173`
2. Click en el ícono de la extensión 🔍 (verde, en la barra superior)
3. Click en **"Activar Inspector"**
4. ¡Ya puedes inspeccionar!

### Funcionalidades

#### **Seleccionar Elementos**
- Haz clic en cualquier elemento de la página
- Aparecerá un **borde verde** y un **label flotante** con:
  - Selector CSS (ID, clases)
  - Dimensiones (ancho × alto)
  - Padding actual
  - Margin actual
  - Posicionamiento

#### **Medir Distancias**
- Selecciona un **primer elemento** → borde verde
- Selecciona un **segundo elemento**  
- Aparecerán **líneas magenta** mostrando las distancias exactas en píxeles

#### **Generar Instrucción para IA**
- El panel muestra automáticamente la instrucción técnica
- Click en **"Copiar Instrucción"**
- Pégala en el chat con Antigravity para modificaciones precisas

---

## 📊 Ejemplo de Salida

```markdown
# Instrucción Técnica para IA

## Elemento 1: `.recommendation-card`

**Dimensiones:** 240px × 320px

**Espaciado:**
- Padding: 12px (T:16px R:12px B:12px L:12px)
- Margin: 0px (T:0px R:0px B:0px L:0px)

**Posición:** relative

**Flexbox:** flex, direction:column, justify:flex-start, align:stretch, gap:normal

---

## Elemento 2: `.card-image`

**Dimensiones:** 240px × 160px

**Espaciado:**
- Padding: 8px (T:8px R:8px B:8px L:8px)
- Margin: 0px (T:0px R:0px B:0px L:0px)

**Posición:** relative

---

## Distancias

- Vertical: **16px**

---
```

---

## 🎨 Interfaz

### Panel de Control (Esquina Superior Derecha)
- **Limpiar Selección:** Borra todos los elementos seleccionados
- **Copiar Instrucción:** Copia el prompt generado al portapapeles
- **Cerrar:** Desactiva el inspector y cierra el panel

### Popup de la Extensión
- **Activar/Desactivar:** Toggle rápido del inspector
- **Estado visual:** Indica si está activo o inactivo

---

## 💡 Consejos de Uso

1. **Para layouts complejos:** Selecciona elementos uno por uno para entender su estructura
2. **Para ajustar espaciado:** Mide la distancia entre elementos hermanos
3. **Para centrado perfecto:** Verifica margins y paddings de contenedores
4. **Para debugging:** Copia la instrucción y compártela con la IA para pedir ajustes

---

## 🔧 Solución de Problemas

### La extensión no aparece
- Verifica que el "Modo de desarrollador" esté activo
- Recarga la extensión desde `chrome://extensions/`

### El inspector no se activa
- Refresca la página web (F5)
- Vuelve a hacer clic en "Activar Inspector"

### No puedo copiar al portapapeles  
- Asegúrate de que el navegador tenga permisos de portapapeles
- Copia manualmente el texto del área de output

---

## 📁 Estructura de Archivos

```
browser-extension/
├── manifest.json       # Configuración de la extensión
├── popup.html          # Interfaz del popup
├── popup.js           # Lógica del popup
├── content.js         # Script del inspector (se inyecta en páginas)
└── icons/
    ├── icon16.png     # Ícono 16×16
    ├── icon48.png     # Ícono 48×48
    └── icon128.png    # Ícono 128×128
```

---

## 🆕 Actualizaciones Futuras

- [ ] Exportar a JSON/CSV
- [ ] Modo de comparación (más de 2 elementos)
- [ ] Captura de screenshots anotados
- [ ] Guardar configuraciones de inspección
- [ ] Integración directa con Antigravity API

---

## 📝 Notas

- La extensión funciona en **cualquier página web**, no solo en tu aplicación local
- Los datos no se envían a ningún servidor, todo es local
- Compatible con Chrome, Edge, Brave y cualquier navegador basado en Chromium
