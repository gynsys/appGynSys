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

## La Solución Definitiva (Hard-Lock a Nivel de OS)

Para cumplir la regla crítica de **"Restringir el movimiento lateral a toda costa SIN modificar el layout del editor"**, se optó por un bloqueo de hardware/gestos en lugar de un bloqueo de caja (CSS Box-Model).

**Acción Final:**
Se inyectó la propiedad CSS **`touch-action: pan-y`** directamente en el contenedor raíz del `MobileLayout.jsx`:

```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 w-full overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
```

### ¿Por qué esto sí funcionó?
La propiedad `touch-action: pan-y` intercepta el evento táctil antes de que se propague al motor de renderizado del navegador. Le indica expresamente al sistema operativo (iOS/Android):
1. El usuario **solo** tiene permitido hacer scroll (pan) en el **eje Y** (arriba/abajo).
2. Cualquier vector táctil en el eje X (izquierda/derecha) debe ser matemáticamente ignorado para navegación, descartando el "Swipe to go back" o el rebote lateral del documento.
3. Al no alterar márgenes (`margin`), rellenos (`padding`), flexbox ni anchos (`width`), la vista previa del Reel y del Carrusel mantienen exactamente su geometría píxel-perfecta para la generación del video, asegurando estabilidad visual sin saltos.
