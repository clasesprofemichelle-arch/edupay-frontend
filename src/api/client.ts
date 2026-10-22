import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://edupay-api-live.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('edupay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
