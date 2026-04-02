export const getImageUrl = (path) => {
  if (!path) return null;
  // If absolute URL, return as-is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;

  // Get API base URL from env or default
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  // If apiBase is relative (starts with /), we're in dev mode with proxy
  // Just return the path as-is (images are served from root /uploads)
  if (apiBase.startsWith('/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return cleanPath;
  }

  // If absolute URL (Production), remove /api/v1 suffix to get root URL
  // apiBase might be something like https://api.gynsys.net/api/v1
  const serverRoot = apiBase.replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${serverRoot}${cleanPath}`;
};
