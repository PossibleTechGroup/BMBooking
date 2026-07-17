/** API and backend URLs — configure via .env (VITE_* variables). */

const VITE_API_URL = import.meta.env.VITE_API_URL || '/api';
export const API_URL = VITE_API_URL.replace(/\/$/, '');

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:52400').replace(/\/$/, '');

/** Full URL for backend-hosted static assets (uploads, receipts, etc.). */
export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}
