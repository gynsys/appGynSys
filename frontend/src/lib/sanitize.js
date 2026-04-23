import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para uso seguro con dangerouslySetInnerHTML.
 * Permite tags seguros y remueve scripts, event handlers, etc.
 * @param {string} dirtyHtml - HTML sin sanitizar
 * @returns {string} - HTML sanitizado
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'figure', 'figcaption', 'video', 'source', 'hr', 'sup', 'sub',
      'svg', 'path'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class', 'style',
      'width', 'height', 'id', 'title', 'viewBox', 'fill',
      'd', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
}
