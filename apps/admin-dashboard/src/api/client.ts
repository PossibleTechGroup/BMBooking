import axios from 'axios';
import { API_URL } from '../config/env';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default client;
