# Estabilidad de Gestos y Layout Móvil (Social Generator)

## El Problema del "Movimiento Lateral" (Pan/Swipe)
Durante la adaptación a móvil del Generador de Redes Sociales (Carrusel y Reels), uno de los problemas más críticos reportados fue que **la pantalla entera se movía o desplazaba lateralmente** al intentar interactuar con los selectores de la interfaz (como ajustar el tamaño del texto, cambiar la duración, o usar barras de rango).

A diferencia de vistas estándar como "Directorios", que fluyen verticalmente (`overflow-y-auto`) respetando el padding maestro, el `MobileLayout.jsx` opera como una "App de Pantalla Completa" anidada. Al interactuar repetidamente o arrastrar elementos dentro de este layout en dispositivos móviles (especialmente en iOS Safari/Chrome), el navegador nativo captura el vector horizontal del toque e inicia un "Pan" o el gesto de "Deslizar para Atrás/Adelante", desencajando la interfaz.

## Intentos de Solución y Diagnóstico

### Intento 1: Restricción CSS Estándar (`overflow-x-hidden`)
- **Acción:** Se aplicó `overflow-x-hidden`, `max-w-100vw` y `overscroll-behavior-x: none` a las etiquetas `html`, `body` en el `index.html`.
- **Resultado:** Fallido / Insuficiente. iOS Safari a menudo ignora `overflow-x: hidden` en el `body` si la interacción comienza sobre un elemento dinámico (como un slider) o si existe un choque de resoluciones por paddings anidados (el `p-4` heredado del `DashboardLayout`). El gesto de arrastre seguía moviendo la pantalla.

### Intento 2: Bloqueo de Controladores Locales (Inputs)
- **Acción:** Se aplicó explícitamente `touch-action: none` (y `touch-none` de Tailwind) directamente en los `<input type="range">` del `VideoEditor.jsx` (tamaño de fuente y duración), así como `touch-action: manipulation` en los botones `+` y `-` del `ContextualBar.jsx`.
- **Resultado:** Parcialmente exitoso. Eliminó el "zoom por doble toque" al presionar botones rápidamente, y redujo el paneo al usar el slider, pero no detuvo el desplazamiento lateral cuando el usuario tocaba cualquier otra área libre o deslizaba ligeramente en diagonal.

### Intento 3: Bloqueo Estricto de Contenedores Maestros (`DashboardLayout`)
- **Acción:** Se forzó un `overflow-x-hidden` global en la etiqueta `<main>` dentro del layout principal del sistema (`DashboardLayout.jsx`) para intentar "guillotinar" cualquier pixel que sobresaliera.
- **Resultado:** Fallido para resolver el problema de gestos. Aunque previno desbordes de renderizado visual, el sistema operativo seguía capturando y ejecutando el vector táctil del "swipe". El lienzo de edición (especialmente el canvas del carrusel) era altamente sensible a cambios estructurales, por lo que remover paddings heredados causaba riesgos de desalinear el renderizado final (proporción 9:16).

## La Solución Definitiva (Corte por Hardware + JavaScript)

El verdadero problema era una combinación de dos factores de renderizado en WKWebView (iOS Safari):
1. **Desbordamiento Fantasma:** Elementos como el selector nativo de color en `ContextualBar.jsx` usaban clases como `inset-[-50%] w-[200%]`. Esto silenciosamente estiraba la "caja de desplazamiento" del documento a más del 100vw, rompiendo los límites del dispositivo.
2. **Deficiencia de `overflow: hidden`:** En iOS Safari, `overflow-x: hidden` oculta visualmente los excedentes, pero **no deshabilita** la capacidad del contenedor o documento de rebotar horizontalmente (scroll physics) cuando se arrastra táctilmente.

**Acción Final (La Combinación Perfecta):**
1. Reemplazamos `overflow-x: hidden` por **`overflow-x: clip`** y añadimos `overscroll-behavior-x: none` en los contenedores maestros (`MobileLayout.jsx`). A diferencia de `hidden`, `clip` anula la generación de contenedores de scroll a nivel de render.
2. Corregimos el `ContextualBar.jsx`, reemplazando el `inset-[-50%]` por `inset-0 w-full h-full scale-150`, manteniendo la visual pero sin corromper el ancho físico global.
3. Se inyectó un `useEffect` en `MobileLayout.jsx` con el modo `{ passive: false }` para hacer `e.preventDefault()` de manera quirúrgica cuando el arrastre es predominantemente horizontal, a menos que el usuario esté deslizando un input de rango.

## 📁 Archivos Modificados Durante la Resolución
Para referencia futura, estos son los archivos clave que fueron editados durante este proceso:
- `frontend/src/modules/blog/pages/social-generator/components/MobileLayout.jsx`: Se inyectó el interceptor táctil de JavaScript, y los contenedores adoptaron `overflow-x: clip`.
- `frontend/src/modules/blog/pages/social-generator/components/ContextualBar.jsx`: Se eliminó el padding fantasma (`inset-[-50%]`) que forzaba el paneo.
- `frontend/src/modules/blog/pages/social-generator/components/VideoEditor.jsx`: Controles deslizantes mantuvieron el manejo aislado para no bloquearse por el bloqueo principal.
