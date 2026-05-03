# Guía de Estabilidad y Arquitectura: Editor de Carruseles GynSys

Este documento detalla la arquitectura técnica, las decisiones recientes y el protocolo de mantenimiento para el generador de contenido social (Carruseles y Reels).

## 1. Arquitectura del Sistema

El editor se divide en tres capas principales de estado:

1.  **Estado de Contenido (`generatedContent`)**: Almacena el texto de las diapositivas y las imágenes insertadas. Reside en `SocialGenerator/index.jsx`.
2.  **Estado de Diseño (`designer.design`)**: Colores, fuentes, bordes y posiciones globales. Reside en `useSlideDesigner.js`.
3.  **Estado de Elementos Libres (`designer.canvas.extraElements`)**: Formas y textos adicionales insertados manualmente. Reside en `useSlideDesigner.js`.

### Integración de IA (Resiliencia Dual)
Para evitar fallas de servicio, el backend (`social_service.py`) utiliza un sistema de **Fallback**:
- **Motor Primario**: Google Gemini (Flash 1.5).
- **Motor de Respaldo**: Groq (Llama 3.1 70B).
- **Limpieza Automática**: Se eliminan etiquetas `<img>` y datos Base64 antes de enviar al LLM para evitar errores de tokenización o límites de tamaño.

---

## 2. Decisiones Técnicas y Soluciones Recientes

### Problema: Error 500 al generar carruseles
- **Causa**: Posts con imágenes incrustadas en Base64 (muy pesadas) saturaban el contexto de la IA.
- **Solución**: Implementado `clean_content_for_ai` en el backend para sanear el texto.

### Problema: Regresiones en controles de diseño
- **Acción**: Se han restaurado los controles de **Papelera** y **Capas (zIndex)**.
- **Detalle Técnico**: Las capas ahora son dinámicas (`zIndex` en `style`) en lugar de usar clases fijas de Tailwind, permitiendo el uso de "Enviar al fondo".

### Problema: Pérdida de trabajo accidental
- **Solución**: Sistema de **Deshacer (Undo)** implementado. Guarda los últimos 20 estados del contenido para revertir borrados accidentales de diapositivas o imágenes.

---

## 3. Checklist de Mantenimiento (Evitar Regresiones)

Antes de realizar un despliegue, verificar manualmente:

- [ ] **Generación**: Probar con un post que tenga imágenes (ej. Dispareunia) para asegurar que el filtro de limpieza funciona.
- [ ] **Importación**: Verificar que los componentes compartidos (ej. `Modal`) usen la ruta relativa correcta: `../../../../../components/common/Modal`.
- [ ] **Capas**: Insertar una imagen y un texto, y verificar que la imagen puede enviarse detrás del texto.
- [ ] **Eliminación**: Verificar que la papelera funciona en imágenes, textos y diapositivas.
- [ ] **Historial**: Realizar un cambio y pulsar "Deshacer" para confirmar que el estado se restaura.
- [ ] **Imágenes**: Confirmar que las imágenes insertadas se ven completas (`object-contain`) y no se cortan.

---

## 4. Comandos de Diagnóstico (Backend)

Si la generación falla, ejecutar en el servidor:
```bash
# Ver logs en tiempo real para detectar si falló Gemini y saltó a Groq
docker logs -f appgynsys-backend-1 --tail 50
```

---

*Última actualización: 03 de Mayo, 2026*
