# Historial de Intentos: Corrección de Overlay en Barra de Estado (Android/Capacitor)

Este documento registra los intentos técnicos realizados para solucionar el problema de recorte del logo y el comportamiento del overlay de la barra de estado en la aplicación GynSys.

## Antecedentes
El logo de la aplicación aparecía cortado en la parte superior debido a que el sistema Android lo renderizaba detrás de la barra de estado (StatusBar) transparente o translúcida.

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

---

## Estado Actual
- **Modo:** Translúcido Original (Restaurado por seguridad y legibilidad).
- **Ajuste Logo:** Inline Inset del 20% aplicado y verificado.
- **Z-Index:** Se ajustaron los modales para que el StatusBar no interfiera con los elementos interactivos prioritarios.
