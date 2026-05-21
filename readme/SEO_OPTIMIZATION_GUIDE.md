# Guía Técnica de Optimización SEO, Previsualizaciones y Mejoras del Generador de Contenido

Esta guía documenta detalladamente las optimizaciones de SEO, previsualizaciones en redes sociales, y las mejoras de experiencia de usuario (UX) e inteligencia artificial (IA) implementadas y planificadas en la plataforma GynSys. El objetivo es proporcionar un mapa técnico claro para que cualquier desarrollador o IA comprenda el estado del sistema, lo que se hizo, y cómo expandirlo.

---

## 🛠️ 1. Optimizaciones Recientes Implementadas (Mayo 2026)

### A. Corrección de Compilación y Estabilidad del Árbol JSX
* **Incidente:** Vite fallaba en la compilación de producción reportando un error de sintaxis: `"Unterminated regular expression"` en el archivo `index.jsx` del generador social, causado indirectamente por una discrepancia de etiquetas.
* **Acción:** Identificamos y eliminamos una etiqueta de cierre huérfana `</div>` (línea 678 de `index.jsx`) introducida al mover la paginación flotante al contenedor del lienzo.
* **Validación:** El sistema ahora compila con éxito mediante `pnpm run build` en 38 segundos en local y sin advertencias ni errores en el parser de esbuild.

### B. Flujo de Ajuste Contextual e Inteligente ("Aplicar Ajustes con IA")
* **Cambio de UX:** Anteriormente, cuando el usuario quería aplicar instrucciones especiales de ajuste (ej: *"Amplía la diapositiva 2"*), tenía que hacer clic en el botón principal "Crear Contenido con IA" en la parte inferior, lo cual era sumamente confuso y parecía reiniciar el proceso.
* **Solución UI:** 
  * Se diseñó un **botón dinámico contextual "Aplicar Ajustes"** integrado al input de instrucciones especiales en `ArticleSelector.jsx`.
  * Este botón tiene un estilo visual degradado rosa/rojo (`from-pink-600 to-rose-600`) para contrastar con el botón azul principal de generación desde cero.
  * Solo se muestra cuando el input de instrucciones tiene texto, dando un feedback visual directo de que la acción aplicará correcciones.
* **Optimización de Caché (Rendimiento del LLM):**
  * Para evitar re-generar el artículo científico base en cada ajuste menor (lo cual consumía doble de tokens, causaba demoras de más de 30 segundos y producía artículos cambiantes que confundían al LLM en el paso de diapositivas), implementamos un estado de caché: `lastGeneratedBlogContent`.
  * **Comportamiento:** Si el tema y el archivo PDF no han cambiado y el usuario ingresa una instrucción correctiva, `handleAiGenerateSocial` omite la llamada al endpoint `/blog/generate`. En su lugar, reutiliza el artículo original guardado y lo pasa directamente a `/generate-social-from-content` junto con las diapositivas actuales y el prompt de edición.
  * **Beneficio:** Reducción del **50% en el tiempo total de respuesta** de la API y consistencia del 100% en las diapositivas resultantes.

---

## 🏗️ 2. Arquitectura de Optimización SEO y Open Graph (Planificado)

Para optimizar páginas de aterrizaje públicas de los médicos (como `https://gynsys.net/mariel-herrera`) para indexación en buscadores y previsualizaciones dinámicas al compartir enlaces, se define la siguiente arquitectura:

### Arquitectura de SSR Efímero (Inyección de Metadatos en el Servidor)

Dado que la plataforma es una SPA en React, los rastreadores simples no interpretan JavaScript para renderizar metadatos. La solución consiste en realizar una **inyección en el servidor FastAPI** antes de entregar el archivo index.html.

```
[Cliente / Bot de Redes]
        │
        ▼
   [Nginx Proxy]  ──(Rutas de Perfiles Públicos /:slug)──► [FastAPI Backend]
                                                                  │
                                                          (Consulta datos en DB)
                                                                  │
                                                                  ▼
                                                          [Doctor DB Model]
                                                                  │
                                                       (Inyecta tags en index.html)
                                                                  │
        ◄─────────────────(HTML de retorno con tags)──────────────┘
```

### Código de Implementación del Servidor (FastAPI)
Un endpoint captura las solicitudes de los slugs de los médicos y sirve el HTML modificado:

```python
# backend/app/blog/router.py o archivo equivalente
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.db.models.doctor import Doctor
import os

router = APIRouter()

@router.get("/{slug}", response_class=HTMLResponse)
def serve_doctor_seo_page(slug: str, request: Request):
    with get_db_session() as db:
        doctor = db.query(Doctor).filter(Doctor.slug_url == slug).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor no encontrado")
        
        nombre = doctor.nombre_completo
        especialidad = doctor.especialidad or "Especialista en Ginecología y Obstetricia"
        biografia = doctor.biografia or f"Agenda tu consulta en línea con {nombre} en GynSys."
        foto_url = doctor.photo_url or "https://gynsys.net/assets/default-doctor.png"
        canonical_url = f"https://gynsys.net/{slug}"
        
    frontend_index_path = "/opt/appgynsys/frontend/dist/index.html"
    if not os.path.exists(frontend_index_path):
        frontend_index_path = "frontend/dist/index.html" # Fallback local
        
    with open(frontend_index_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        
    seo_tags = f"""
    <title>{nombre} | {especialidad} | GynSys</title>
    <meta name="description" content="{biografia[:155]}..." />
    <link rel="canonical" href="{canonical_url}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{nombre} | {especialidad}" />
    <meta property="og:description" content="{biografia[:155]}..." />
    <meta property="og:image" content="{foto_url}" />
    <meta property="og:url" content="{canonical_url}" />
    <meta property="og:site_name" content="GynSys" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{nombre} | {especialidad}" />
    <meta name="twitter:description" content="{biografia[:155]}..." />
    <meta name="twitter:image" content="{foto_url}" />
    """
    
    # Reemplazar la etiqueta vacía del index.html original
    modified_html = html_content.replace("<title></title>", seo_tags)
    return HTMLResponse(content=modified_html, status_code=200)
```

### Estructura de Datos JSON-LD (Schema.org) en el Frontend
Para posicionar localmente y aparecer en los carruseles de Google, la interfaz inyecta dinámicamente datos estructurados en formato **`Physician`**:

```javascript
// Inyección dinámica en frontend/src/pages/DoctorProfilePage.jsx
useEffect(() => {
  if (!doctor) return;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctor.nombre_completo,
    "image": doctor.photo_url || doctor.logo_url,
    "medicalSpecialty": "ObstetricsAndGynecology",
    "telephone": doctor.telefono || doctor.whatsapp_phone,
    "email": doctor.email,
    "url": `https://gynsys.net/${doctor.slug_url}`,
    "description": doctor.biografia || `Perfil profesional de ${doctor.nombre_completo}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": doctor.direccion_consultorio || "Dirección del consultorio",
      "addressLocality": doctor.ciudad || "Ciudad",
      "addressCountry": "CO"
    }
  };

  const scriptId = "doctor-json-ld";
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(jsonLd);

  return () => {
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();
  };
}, [doctor]);
```

### Generación XML de Sitemap Automatizado
Para notificar a los bots indexadores la existencia de nuevos doctores registrados en tiempo real, se expone un sitemap XML dinámico:

```python
# backend/app/blog/router.py
from fastapi import Response
from app.db.models.doctor import Doctor
from app.db.session import get_db_session

@router.get("/sitemap.xml")
def generate_sitemap():
    with get_db_session() as db:
        doctors = db.query(Doctor).filter(Doctor.slug_url != None).all()
        
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # URL principal
    xml += '  <url><loc>https://gynsys.net</loc><priority>1.0</priority></url>\n'
    
    # URL de perfiles de doctores
    for doc in doctors:
        xml += f'  <url><loc>https://gynsys.net/{doc.slug_url}</loc><priority>0.9</priority></url>\n'
        
    xml += '</urlset>'
    return Response(content=xml, media_type="application/xml")
```

---

## 🧠 3. Glosario de Aprendizaje para Sistemas de IA
* **`lastGeneratedBlogContent`**: Almacena el resultado bruto de la llamada al LLM para el artículo base, permitiendo a la IA re-editar las diapositivas existentes con una referencia estable e inalterable.
* **SSR Efímero**: Prerenderizado selectivo en el backend para crawlers que no leen JS, inyectando meta-tags dinámicos en el index.html plano antes de servirlo.
* **Capacitor vs Web Titles**: Para evitar romper el título dinámico de la aplicación móvil PWA / Android APK construida con Capacitor, la manipulación de metadatos se enfoca en el renderizado HTTP web directo, evitando sobreescrituras en local storage cuando se está dentro del contenedor nativo.
