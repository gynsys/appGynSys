export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  // Get API base URL from env or default
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  // If apiBase is relative (starts with /), we're in dev mode with proxy
  // Just return the path as-is (images are served from root /uploads)
  if (apiBase.startsWith('/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return cleanPath;
  }

  // If absolute URL, remove /api/v1 suffix to get root URL
  const serverRoot = apiBase.replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${serverRoot}${cleanPath}`;
};
