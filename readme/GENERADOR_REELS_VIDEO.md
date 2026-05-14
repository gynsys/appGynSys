# Generador de Video Reels (Social Generator) - GynSys

Este módulo permite la creación automatizada de videos cortos (Reels/Shorts) optimizados para redes sociales, partiendo de artículos del blog médico o carruseles existentes.

## 🚀 Características Principales

- **IA Scripting**: Transforma artículos largos en secuencias de escenas cortas (máx. 15 palabras por slide) para máxima retención.
- **Motor de Renderizado Browser-Side**: Utiliza `HTML5 Canvas` para dibujar las escenas y `MediaRecorder API` para generar archivos `.mp4` reales directamente en el navegador del usuario.
- **Estudio de Audio Integrado**:
  - Selección de pistas de stock (Mixkit).
  - Sistema de pre-escucha individual.
  - Soporte para carga de archivos externos (`.mp3`, `.wav`).
  - Mezcla automática de audio y video en la exportación.
- **Personalización Visual Total**:
  - Control de tipografía (fuente, tamaño, color).
  - Control de ambiente (color de fondo de diapositivas).
  - Soporte multimedia (una imagen de fondo personalizada por escena).
- **Conversión Inteligente**: Capacidad de transformar carruseles estáticos guardados en videos dinámicos con un solo clic.

## 🛠️ Detalles Técnicos

### Motor de Exportación
El archivo `index.jsx` contiene la función `handleExportVideo`, que realiza los siguientes pasos:
1. Inicializa un `Offscreen Canvas` de 720x1280 (formato 9:16).
2. Captura el `MediaStream` del canvas a 30 FPS.
3. Captura el `AudioStream` del elemento `<audio>` activo.
4. Combina ambos flujos en un nuevo `MediaStream`.
5. Graba el resultado usando el codec `video/webm;codecs=vp9,opus` y lo empaqueta como `.mp4`.

### Descargas Móviles y Híbridas (Capacitor)
Debido a estrictas políticas de seguridad en iOS y Android, descargar un objeto `Blob` generado localmente (`URL.createObjectURL`) falla o es bloqueado silenciosamente. Para resolver esto, hemos implementado una **Estrategia Tripartita de Descargas**:

1. **Escritorio (Desktop):** Se usa la etiqueta nativa `<a>` con el atributo `download` para descargar el Blob generado en RAM inmediatamente sin tocar el servidor.
2. **Web Móvil (iOS/Android Safari/Chrome):** El `Blob` MP4 se sube temporalmente al backend vía un endpoint proxy (`/api/export/proxy-download/`). El backend lo guarda y devuelve una URL prefirmada, hacia donde redirigimos al navegador mediante `window.location.href`. Esto invoca el gestor de descargas nativo del OS.
3. **App Híbrida (Capacitor):** Las WebViews nativas no saben interpretar `window.location.href` para descargas (muestran pantalla blanca o fallan). La solución es subir el archivo al backend igual que en Web Móvil, pero invocar la URL resultante usando el plugin oficial `@capacitor/browser` (`openExternalFile` / `Browser.open`). Esto saca la URL de la WebView y la abre en el navegador nativo del sistema operativo (Safari o Chrome Custom Tabs), el cual procesa y guarda el MP4 en el dispositivo exitosamente.

### Atributos de Seguridad
Para permitir la grabación de recursos externos (imágenes y música), todos los elementos multimedia utilizan `crossOrigin="anonymous"`.

## 📖 Flujo de Usuario

1. **Selección**: Elegir un artículo de la lista.
2. **Generación**: Pulsar "Generar Video" o "Convertir a Video" desde un carrusel.
3. **Edición**: Ajustar textos, subir imágenes de fondo y elegir la música.
4. **Estilo**: Configurar colores y fuentes en el panel "Estilos de Video".
5. **Exportación**: Pulsar "Exportar Video MP4". El proceso tardará unos segundos dependiendo de la duración (basada en el tiempo por slide configurado).

## ⚠️ Notas de Mantenimiento
- **Memoria**: La exportación ocurre en la RAM del cliente. Videos muy largos (>2 min) pueden causar lentitud en dispositivos de gama baja.
- **Autoplay**: Los navegadores bloquean el sonido inicial. El usuario debe interactuar (Play/Pause) para "despertar" el motor de audio.

---
*Documentación generada el 11 de Mayo de 2026 para el ecosistema GynSys.*
