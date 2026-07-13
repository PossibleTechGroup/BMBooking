/** API and backend URLs — configure via .env (VITE_* variables). */

const VITE_API_URL = import.meta.env.VITE_API_URL || '/api';
export const API_URL = VITE_API_URL.replace(/\/$/, '');

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://157.180.114.86:52400').replace(/\/$/, '');

export const TELEBIRR_URL = import.meta.env.VITE_TELEBIRR_URL || 'http://157.180.114.86:53402';

export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_URL}${path}`;
}
