# Historial de Intentos: Corrección de Overlay en Barra de Estado (Android/Capacitor)

Este documento registra los intentos técnicos realizados para solucionar el problema de recorte del logo y el comportamiento del overlay de la barra de estado en la aplicación GynSys.

## Antecedentes
El logo de la aplicación aparecía cortado en la parte superior debido a que el sistema Android lo renderizaba detrás de la barra de estado (StatusBar) transparente o translúcida. Además, los iconos del sistema (hora, señal, WiFi, batería) se veían grisáceos/deslavados por un "scrim" semi-transparente que Android aplica automáticamente.

---

## Intento 1: Padding Directo y Opacidad Scrim (No Satisfactorio)
- **Acción:** Se intentó aumentar el padding superior en el contenedor global de la aplicación.
- **Resultado:** Solucionaba el recorte pero creaba un espacio vacío inconsistente entre diferentes modelos de dispositivos (notches vs bordes tradicionales). 
- **Problema:** La visibilidad de los iconos de la barra de estado era deficiente sobre ciertos fondos claros.

## Intento 2: Ajuste de Temas Nativos (styles.xml)
- **Acción:** Se modificó `styles.xml` para forzar `windowTranslucentStatus` a false.
- **Resultado:** La barra de estado se volvía sólida (negra), pero rompía el diseño "edge-to-edge" de la marca. Se revirtió para mantener la estética premium.

## Intento 3: Implementación de Inset del 20% (Solución Final Logo)
- **Acción:** En lugar de padding en el contenedor, se aplicó un ajuste de **20%** en la posición absoluta del logo solo en la pantalla de carga (SplashScreen).
- **Resultado:** **Éxito**. El logo de GynSys se visualiza centrado y sin recortes superiores, respetando la zona segura de la StatusBar.

## Intento 4: Restauración de Nitidez (StatusBar Scrim)
- **Acción:** Se intentó eliminar el "scrim" (sombra translúcida) para ganar nitidez.
- **Resultado:** Se revirtió porque la legibilidad de la hora y batería se perdía sobre imágenes de fondo brillantes.

## Intento 5: StatusBar Transparente (Fallido - 2026-04-05)
- **Acción:** Se configuró `android:statusBarColor` como `@android:color/transparent` con `android:windowLightStatusBar: true` en `styles.xml`.
- **Resultado:** **Falló**. La barra se volvió una franja negra sólida porque el `windowBackground` del tema es `#000000` (necesario para evitar el fogonazo blanco al arrancar), y la transparencia dejó ver ese fondo negro.

## Intento 6: StatusBar Blanca Sólida (✅ SOLUCIÓN FINAL - 2026-04-05)
- **Acción:** Se configuró `android:statusBarColor` como `#FFFFFF` (blanco sólido) con `android:windowLightStatusBar: true` en `values/styles.xml`.
- **Resultado:** **Éxito total**. Los iconos del sistema (hora, señal, WiFi, batería) se ven completamente negros y nítidos sobre fondo blanco. La barra se fusiona visualmente con el Navbar blanco de la app.
- **Commit:** `48ff435` — `fix(android): use solid white status bar instead of transparent to avoid black band`
- **Archivos modificados:**
  - `frontend/android/app/src/main/res/values/styles.xml`
  - `frontend/android/app/src/main/res/values-v31/styles.xml`

### Configuración final en `values/styles.xml`:
```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:windowBackground">#000000</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:statusBarColor">#FFFFFF</item>
    <item name="android:windowLightStatusBar">true</item>
    <item name="android:navigationBarColor">#000000</item>
</style>
```

### Configuración final en `values-v31/styles.xml` (Android 12+):
```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#000000</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/transparent</item>
    <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    <item name="android:windowLightStatusBar">false</item>
</style>
```

---

## Estado Actual
- **Modo:** Blanco sólido con iconos negros nítidos.
- **Splash:** Fondo negro con iconos blancos → transiciona a barra blanca con iconos negros al cargar la app.
- **Ajuste Logo:** Inline Inset del 20% aplicado y verificado.
- **Z-Index:** Se ajustaron los modales para que el StatusBar no interfiera con los elementos interactivos prioritarios.
