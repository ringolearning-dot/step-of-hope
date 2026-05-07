import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Images now have public_url from Supabase Storage
export function getImageUrl(filenameOrUrl: string) {
  // If it's already a full URL (from Supabase), return as-is
  if (filenameOrUrl.startsWith('http')) return filenameOrUrl;
  // Fallback for legacy local paths
  return `${API_URL.replace('/api', '')}/uploads/images/${filenameOrUrl}`;
}

export { API_URL };
export default api;
