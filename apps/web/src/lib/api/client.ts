import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const TELEBIRR_URL =
  process.env.NEXT_PUBLIC_TELEBIRR_URL || 'https://bmtelebirr.possibletechplc.com';

export const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
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

// Endpoints where a 401 is a login/OTP failure, not an expired session.
// Redirecting on these wiped the form and reloaded the page, hiding the error.
const AUTH_ENDPOINTS = ['/admin/login', '/auth/'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url: string = error.config?.url || '';
      const isAuthCall = AUTH_ENDPOINTS.some((path) => url.includes(path));
      const hasSession = !!localStorage.getItem('auth_token');
      if (!isAuthCall && hasSession) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
