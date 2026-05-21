/**
 * Netlify Edge Function: doctor-seo-prerender
 *
 * Intercepta las rutas públicas antes de que Netlify sirva el index.html
 * estático y pre-inyecta etiquetas Open Graph, Twitter Cards y JSON-LD
 * para que WhatsApp, Facebook, Instagram, Telegram y los crawlers de
 * Google reciban un HTML completo con metadatos SEO correctos sin que
 * la aplicación React necesite ejecutarse.
 *
 * Rutas cubiertas:
 *   /:slug                    → Perfil público del médico
 *   /:slug/blog               → Listado de artículos del médico
 *   /:slug/blog/:postSlug     → Artículo individual del blog
 */

const API_BASE = "https://api.gynsys.net/api/v1";

// Slugs reservados del sistema que NO son perfiles de médicos
const RESERVED_FIRST_SEGMENTS = new Set([
  "dashboard",
  "login",
  "register",
  "admin",
  "reset-password",
  "forgot-password",
  "manifest.webmanifest",
  "sw.js",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "assets",
  "uploads",
  "_redirects",
  "api",
]);

/**
 * Escapa caracteres especiales de HTML para evitar XSS en los atributos.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Construye la URL absoluta de una imagen del backend.
 * @param {string|null} url
 * @param {string} fallback
 * @returns {string}
 */
function buildImageUrl(url, fallback = "https://gynsys.net/GynSys.png") {
  if (!url) return fallback;
  return url.startsWith("http") ? url : `https://api.gynsys.net${url}`;
}

/**
 * Genera el bloque HTML de etiquetas SEO listas para inyectar.
 * @param {string} title
 * @param {string} description
 * @param {string} imageUrl
 * @param {string} canonicalUrl
 * @returns {string}
 */
function buildSeoTags({ title, description, imageUrl, canonicalUrl }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(imageUrl);
  const u = escapeHtml(canonicalUrl);

  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />

    <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GynSys" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${u}" />
    <meta property="og:locale" content="es_CO" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
  `.trim();
}

export default async function handler(request, context) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return context.next();
  }

  const firstSegment = pathSegments[0];

  // Ignorar paths reservados del sistema
  if (RESERVED_FIRST_SEGMENTS.has(firstSegment.toLowerCase())) {
    return context.next();
  }

  // Ignorar archivos estáticos con extensión (.js, .css, .png, .webp, etc.)
  if (/\.\w{2,5}$/.test(firstSegment)) {
    return context.next();
  }

  const doctorSlug = firstSegment;
  const secondSegment = pathSegments[1]; // "blog" o undefined
  const postSlug = pathSegments[2];      // slug del artículo o undefined

  let seoMeta = null;

  // ── CASO 1: /:slug/blog/:postSlug — Artículo individual ──────────────────
  if (secondSegment === "blog" && postSlug) {
    try {
      const [doctorRes, postRes] = await Promise.all([
        fetch(`${API_BASE}/profiles/${doctorSlug}`, {
          signal: AbortSignal.timeout(3000),
        }),
        fetch(`${API_BASE}/blog/public/post/${postSlug}`, {
          signal: AbortSignal.timeout(3000),
        }),
      ]);

      if (doctorRes.ok && postRes.ok) {
        const doctor = await doctorRes.json();
        const post = await postRes.json();

        const doctorNombre = doctor.nombre_completo || "Médico GynSys";
        const postTitulo = post.title || "Artículo médico";

        // Extraer texto limpio del contenido HTML para la descripción
        const rawContent = (post.excerpt || post.content || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const descripcion =
          rawContent.substring(0, 155) ||
          `Artículo del Blog de ${doctorNombre} en GynSys.`;

        seoMeta = {
          title: `${postTitulo} | ${doctorNombre} | GynSys`,
          description: `${descripcion}...`,
          imageUrl: buildImageUrl(
            post.cover_image,
            buildImageUrl(doctor.photo_url || doctor.logo_url)
          ),
          canonicalUrl: `https://gynsys.net/${doctorSlug}/blog/${postSlug}`,
        };
      }
    } catch (_err) {
      return context.next();
    }
  }

  // ── CASO 2: /:slug/blog — Listado del blog del médico ────────────────────
  else if (secondSegment === "blog" && !postSlug) {
    try {
      const doctorRes = await fetch(`${API_BASE}/profiles/${doctorSlug}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (doctorRes.ok) {
        const doctor = await doctorRes.json();
        const nombre = doctor.nombre_completo || "Médico GynSys";
        const especialidad = doctor.especialidad || "Ginecología y Obstetricia";

        seoMeta = {
          title: `Blog Médico de ${nombre} | ${especialidad} | GynSys`,
          description: `Artículos de salud femenina y ginecología escritos por ${nombre}. Encuentra información confiable sobre tu bienestar.`,
          imageUrl: buildImageUrl(doctor.photo_url || doctor.logo_url),
          canonicalUrl: `https://gynsys.net/${doctorSlug}/blog`,
        };
      }
    } catch (_err) {
      return context.next();
    }
  }

  // ── CASO 3: /:slug — Perfil público del médico ───────────────────────────
  else if (pathSegments.length === 1) {
    try {
      const doctorRes = await fetch(`${API_BASE}/profiles/${doctorSlug}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (doctorRes.ok) {
        const doctor = await doctorRes.json();
        const nombre = doctor.nombre_completo || "Médico GynSys";
        const especialidad =
          doctor.especialidad || "Ginecología y Obstetricia";
        const bioRaw =
          doctor.biografia ||
          `Agenda tu consulta con ${nombre} en GynSys.`;
        const descripcion = bioRaw.substring(0, 155);

        seoMeta = {
          title: `${nombre} | ${especialidad} | GynSys`,
          description: `${descripcion}...`,
          imageUrl: buildImageUrl(doctor.photo_url || doctor.logo_url),
          canonicalUrl: `https://gynsys.net/${doctorSlug}`,
        };
      }
    } catch (_err) {
      return context.next();
    }
  }

  // Si no pudimos determinar ningún meta SEO, pasar sin modificar
  if (!seoMeta) {
    return context.next();
  }

  // ── Obtener y modificar el index.html base servido por Netlify ──────────
  const response = await context.next();
  const originalHtml = await response.text();

  const seoTags = buildSeoTags(seoMeta);
  const modifiedHtml = originalHtml.replace("<title></title>", seoTags);

  return new Response(modifiedHtml, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      "content-type": "text/html; charset=utf-8",
      // Cachear 5 minutos en CDN — suficiente para bots de previsualización
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}

export const config = {
  path: "/*",
};
