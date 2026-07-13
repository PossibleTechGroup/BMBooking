import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TELEBIRR = process.env.EXPO_PUBLIC_TELEBIRR_URL;
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP;

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:52400`;
    }
    return 'http://localhost:52400';
  }
  if (API_URL) return API_URL.replace(/\/$/, '');
  
};

export const TELEBIRR_URL =
  (__DEV__ ? `http://${LOCAL_IP}:53402` : TELEBIRR);

export const BASE_URL = getBaseUrl();
