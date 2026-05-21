/**
 * Netlify Edge Function: doctor-seo-prerender
 *
 * Intercepta las rutas públicas de los médicos (/:slug) antes de
 * que Netlify sirva el index.html estático. Consulta los datos del
 * médico desde la API del backend, e inyecta dinámicamente las
 * etiquetas Open Graph, Twitter Cards y el título del documento
 * en el HTML resultante.
 *
 * De esta forma, los bots de WhatsApp, Facebook, Instagram, Telegram,
 * Twitter/X y los rastreadores de Google reciben un HTML completo con
 * metadatos SEO correctos, SIN que la aplicación React necesite ejecutarse.
 */

const API_BASE = "https://api.gynsys.net/api/v1";

// Slugs reservados del sistema que NO son perfiles de médicos
const RESERVED_PATHS = new Set([
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
 * Escapa caracteres especiales de HTML para evitar XSS en los atributos meta.
 * @param {string} str - Cadena a escapar.
 * @returns {string} Cadena segura para insertar en HTML.
 */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(request, context) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);

  // Solo procesar rutas de primer nivel: /slug
  if (pathSegments.length !== 1) {
    return context.next();
  }

  const slug = pathSegments[0];

  // Ignorar paths reservados del sistema
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return context.next();
  }

  // Ignorar archivos estáticos con extensión (.js, .css, .png, etc.)
  if (/\.\w{2,5}$/.test(slug)) {
    return context.next();
  }

  let doctorData = null;

  try {
    // Consultar datos del médico en el backend GynSys
    const apiResponse = await fetch(
      `${API_BASE}/profiles/${slug}`,
      {
        headers: { "Content-Type": "application/json" },
        // Timeout de 3 segundos para no bloquear la respuesta al usuario
        signal: AbortSignal.timeout(3000),
      }
    );

    if (apiResponse.ok) {
      doctorData = await apiResponse.json();
    }
  } catch (_err) {
    // Si la API no responde, servir el index.html original sin modificar
    // para no interrumpir la experiencia del usuario final.
    return context.next();
  }

  // Si no encontramos un médico con ese slug, pasar al handler por defecto
  if (!doctorData) {
    return context.next();
  }

  // ── Extraer y preparar los datos del médico ──────────────────────────────
  const nombre = escapeHtml(
    doctorData.nombre_completo || "Médico en GynSys"
  );
  const especialidad = escapeHtml(
    doctorData.especialidad || "Ginecología y Obstetricia"
  );
  const bioRaw =
    doctorData.biografia ||
    `Agenda tu consulta con ${doctorData.nombre_completo} en GynSys.`;
  const descripcion = escapeHtml(bioRaw.substring(0, 155));

  // Construir URL de imagen prioritizando photo_url > logo_url > default
  let imagenUrl = "https://gynsys.net/GynSys.png";
  if (doctorData.photo_url) {
    imagenUrl = doctorData.photo_url.startsWith("http")
      ? doctorData.photo_url
      : `https://api.gynsys.net${doctorData.photo_url}`;
  } else if (doctorData.logo_url) {
    imagenUrl = doctorData.logo_url.startsWith("http")
      ? doctorData.logo_url
      : `https://api.gynsys.net${doctorData.logo_url}`;
  }

  const canonicalUrl = `https://gynsys.net/${slug}`;
  const pageTitle = `${nombre} | ${especialidad} | GynSys`;

  // ── Bloque de etiquetas SEO a inyectar ──────────────────────────────────
  const seoTags = `
    <title>${pageTitle}</title>
    <meta name="description" content="${descripcion}..." />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / WhatsApp / Facebook / LinkedIn -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GynSys" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${descripcion}..." />
    <meta property="og:image" content="${imagenUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:locale" content="es_CO" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="${descripcion}..." />
    <meta name="twitter:image" content="${imagenUrl}" />
  `.trim();

  // ── Obtener y modificar el index.html base de Netlify ───────────────────
  const response = await context.next();
  const originalHtml = await response.text();

  // Reemplazar el <title></title> vacío por el bloque SEO completo
  const modifiedHtml = originalHtml.replace("<title></title>", seoTags);

  return new Response(modifiedHtml, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      "content-type": "text/html; charset=utf-8",
      // No cachear en CDN para bots — siempre datos frescos
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}

export const config = {
  // Ejecutar en TODAS las rutas. El propio handler filtra las rutas relevantes.
  path: "/*",
};
