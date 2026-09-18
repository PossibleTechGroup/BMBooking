import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TELEBIRR = process.env.EXPO_PUBLIC_TELEBIRR_URL;
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP;
const LOCAL_API_PORT = process.env.EXPO_PUBLIC_LOCAL_API_PORT || '5000';

const PRODUCTION_API = 'https://bmbookingapi.possibletechplc.com';
const PRODUCTION_TELEBIRR = 'https://bmtelebirr.possibletechplc.com';

const getBaseUrl = () => {
  if (API_URL && !API_URL.includes('localhost') && !API_URL.includes('10.0.2.2') && !API_URL.includes('10.47.')) {
    return API_URL.replace(/\/$/, '');
  }
  return PRODUCTION_API;
};

export const TELEBIRR_URL = TELEBIRR || PRODUCTION_TELEBIRR;

export const BASE_URL = getBaseUrl();

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}
