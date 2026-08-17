import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://bmbookingapi.possibletechplc.com';

export const TELEBIRR_URL =
  process.env.NEXT_PUBLIC_TELEBIRR_URL || 'http://157.180.114.86:53402';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
