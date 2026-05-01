import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || '';
  if (!url) return '/api/v1';
  return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
};

const client = axios.create({
  baseURL: getBaseURL(),

  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  // Set language from store or localStorage
  const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'tr' : 'tr';
  config.headers['Accept-Language'] = lang;
  
  return config;
});

// Response Interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const { data } = await client.post('/auth/refresh');
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
