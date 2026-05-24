# 📝 Guía Técnica: Editor de Informes Médicos Rápidos y Dinámicos

Esta guía documenta la arquitectura, el flujo de interacción, los archivos modificados y la lógica de generación del **Editor de Informes Médicos Rápidos**, una funcionalidad diseñada para que los médicos redacten, editen y envíen informes médicos independientes de manera rápida desde cualquier dispositivo (móvil o escritorio) sin requerir obligatoriamente una historia clínica previa.

---

## 1. Arquitectura y Flujo del Sistema

La funcionalidad opera a través de dos fases principales integradas en un flujo interactivo y fluido:

### A. Flujo del Chatbot Interactivo (Máquina de Estados)
Al iniciar un nuevo informe, un chatbot recopila los datos clínicos de forma interactiva para evitar formularios tediosos y optimizar el uso móvil:
1. **Datos Básicos:** Nombre, Cédula de Identidad, Edad, Peso, Motivo de Consulta y Examen Físico.
2. **Hallazgos Ecográficos:** Ecografía ginecológica.
3. **Colección Dinámica de Diagnósticos:**
   - Pregunta: *"¿Cuántos diagnósticos tiene la paciente?"*
   - Pide e ingresa cada diagnóstico de forma individual y secuencial.
4. **Colección Dinámica del Plan Terapéutico:**
   - Pregunta: *"¿Cuántos ítems tiene el plan terapéutico?"*
   - Solicita cada plan/medicación de forma individual y secuencial.
5. **Opción de Saltar:** En todo momento, el botón **"SALTAR"** permite al médico pasar directamente al modo de edición manual con la plantilla limpia.

### B. Modo Editor Premium y Previsualización Dinámica
Una vez completado el chatbot (o al presionar saltar):
1. **Campos Editables (Izquierda):** Un formulario ordenado permite modificar cualquier dato capturado por el chatbot, incluyendo fecha de emisión, modo PDF a color y marca de agua.
2. **Previsualización Virtual (Derecha):** Una hoja digital interactiva refleja en tiempo real el diseño exacto en tamaño carta del PDF final.
3. **Anexo de Imágenes Ecográficas:**
   - Permite subir imágenes de forma interactiva usando el componente `ConsultationAssetManager` una vez guardado el informe.
   - Envía el parámetro `include_images=true` automáticamente para adjuntar las imágenes en el PDF.

---

## 2. Archivos Clave del Sistema

### 📱 Frontend: `ReportEditorPage.jsx`
* **Ruta:** `frontend/src/pages/dashboard/ReportEditorPage.jsx`
* **Responsabilidades:**
  * Define la máquina de estados del chatbot (`STEPS` enum) para guiar la conversación.
  * Gestiona el cargador rápido de informes recientes (`INDEPENDENT_REPORT` identificados por `family_history_mother === 'INDEPENDENT_REPORT'`).
  * Renderiza la hoja de previsualización en tiempo real con datos clínicos y médicos limpios de fallbacks ficticios.
  * Integra el cargador de imágenes `ConsultationAssetManager` justo debajo del formulario.

### 🐍 Backend: `pdf_generator.py`
* **Ruta:** `backend/app/utils/pdf_generator.py`
* **Responsabilidades:**
  * Genera el informe médico en formato PDF tamaño carta.
  * **Lógica de Grilla Dinámica de Anexos (¡Novedad!):** Detecta automáticamente cuántas imágenes ecográficas han sido anexadas por el médico (máximo 4) y divide la página de forma inteligente:
    * **1 Imagen:** 1 sola imagen grande y centrada ($7.0 \times 6.0$ pulgadas).
    * **2 Imágenes:** Divide la página simétricamente en 2 mitades verticales ($7.0 \times 3.1$ pulgadas cada una).
    * **3 Imágenes:** Divide la página simétricamente en 3 franjas verticales ($7.0 \times 2.05$ pulgadas cada una).
    * **4 Imágenes:** Distribución en grilla de cuadrante $2\times 2$ ($3.5 \times 3.1$ pulgadas cada celda).

### 🔗 API Endpoints: `consultations.py`
* **Ruta:** `backend/app/api/v1/endpoints/consultations.py`
* **Responsabilidades:**
  * Expone el endpoint `/consultations/{id}/pdf` con los parámetros `include_images` y `use_color`.
  * Permite guardar y editar informes independientes persistiendo el peso en la columna `observations`.

---

## 3. Guía de Uso Rápido para el Desarrollador

### A. Para Limpiar la Base de Datos o Probar:
Los informes independientes se guardan con el flag especial:
```python
family_history_mother = "INDEPENDENT_REPORT"
```
Esto asegura que **no se listen** en la pestaña general de Historias Clínicas de pacientes comunes, manteniéndolos en su módulo exclusivo.

### B. Modificar Estilos del PDF
Toda la lógica de diseño del anexo y su grilla inteligente se encuentra en la función `generate_summary_report` del archivo `pdf_generator.py`:
```python
# dynamic grid code
assets = [a for a in report_data.get('assets', []) if "image" in (a.get('file_type') or "").lower()][:4]
num_images = len(assets)
```
Cualquier cambio en los márgenes de las celdas debe ajustarse en la variable `rowHeights` de la tabla de ReportLab correspondiente.
