# Bitácora de Ajustes: Barra de Estado (Status Bar) en Android

Este documento detalla los intentos y soluciones aplicados para resolver el conflicto entre el contenido web y la barra de estado del dispositivo en la aplicación móvil (Capacitor).

## Problema Inicial
El contenido de la aplicación se deslizaba por debajo de la barra de estado (overlay), dificultando la visibilidad de elementos superiores como la Navbar o el estado de batería/reloj en ciertos dispositivos Android.

## Intentos y Evolución

### 1. Desactivación del Overlay (Fallo de Diseño)
- **Acción:** Se intentó usar `StatusBar.setOverlaysWebView({ overlay: false })` en `App.jsx`.
- **Resultado:** Si bien separó el contenido de la barra, rompió la estética "premium" y translúcida que el usuario deseaba mantener. Además, generaba un espacio negro sólido en la parte superior que no coordinaba con el diseño Glassmorphism.

### 2. Inyección de CSS y Meta Tags (Insuficiente)
- **Acción:** Se intentó usar `react-helmet-async` para forzar `viewport-fit=cover` dinámicamente y variables CSS como `safe-area-inset-top`.
- **Resultado:** No fue suficiente para controlar el comportamiento nativo de Capacitor en todos los modelos de Android, especialmente con el "Notch".

### 3. Sincronización en Inicialización (Mejora Parcial)
- **Acción:** Se movió la lógica de `StatusBar` al componente `CapacitorPushListener` y al inicio de `initApp` en `App.jsx` para asegurar que el estado se definiera antes del renderizado completo.
- **Resultado:** Redujo el "salto" visual al cargar la app, pero persistían discrepancias entre el modo claro y oscuro.

### 4. Reversión al Translúcido Original (Solución Solicitada)
- **Acción:** El usuario solicitó volver al diseño original donde la barra es translúcida y el contenido fluye por detrás, pero asegurando que la visibilidad fuera constante.
- **Implementación final:**
    - Se mantuvo `StatusBar.setOverlaysWebView({ overlay: true })`.
    - Se configuró `StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })`.
    - Se ajustó el padding superior en la Navbar mediante clases de Tailwind conditionally (`pt-[env(safe-area-inset-top)]`) para evitar colisiones sin perder el efecto de fondo.

## Estado Actual
La barra de estado funciona en modo **translúcido**, permitiendo que los degradados de la aplicación se extiendan hasta el borde del dispositivo, cumpliendo con la estética premium requerida por GynSys.

---
> [!NOTE]
> Cualquier cambio futuro en la configuración nativa de Android debe realizarse preferiblemente en `capacitor.config.ts` o mediante el plugin `@capacitor/status-bar` de forma centralizada en `App.jsx`.
