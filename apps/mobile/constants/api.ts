import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TELEBIRR = process.env.EXPO_PUBLIC_TELEBIRR_URL;
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP;

const PRODUCTION_API = 'https://bmbookingapi.possibletechplc.com';
const PRODUCTION_TELEBIRR = 'http://157.180.114.86:53402';

const getBaseUrl = () => {
  if (API_URL) return API_URL.replace(/\/$/, '');
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:52400`;
    }
    return 'http://localhost:52400';
  }
  return PRODUCTION_API;
};

export const TELEBIRR_URL =
  (__DEV__ ? `http://${LOCAL_IP}:53402` : TELEBIRR || PRODUCTION_TELEBIRR);

export const BASE_URL = getBaseUrl();

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}
