export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Get API base URL from env or default
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  
  // Remove /api/v1 suffix to get root URL
  // This handles both 'http://localhost:8000/api/v1' and 'http://localhost:8000/api/v1/'
  const serverRoot = apiBase.replace(/\/api\/v1\/?$/, '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${serverRoot}${cleanPath}`;
};
