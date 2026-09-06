const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export function assetUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}