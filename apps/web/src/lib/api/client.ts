import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'react-hot-toast';
import { logger } from '../logger';

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

  // Logging
  (config as any).metadata = { startTime: Date.now() };
  logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, { action: 'api_request' });
  
  return config;
});

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const duration = Date.now() - config.metadata.startTime;
    logger.debug(`← ${response.status} ${config.url} (${duration}ms)`, { action: 'api_response' });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const config = error.config as any;
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
    
    // Logging error
    const errBody = error.response?.data;
    const isDev = process.env.NODE_ENV !== 'production';

    logger.warn(`← ${error.response?.status || 'NETWORK_ERROR'} ${config?.url}`, 
      { action: 'api_error' }, 
      {
        status:     error.response?.status,
        error_code: errBody?.error?.code,
        message:    errBody?.error?.message,
        request_id: errBody?.request_id,
        duration,
      }
    );

    // Development ortamında DebugOverlay ve konsol için detaylı hata bas
    if (isDev) {
      const debugMsg = errBody?.error?.detail || errBody?.error?.message || error.message;
      console.error(`[API ERROR] ${config?.method?.toUpperCase()} ${config?.url} | ${debugMsg}`);
    }

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
    
    // Handle 402 Payment Required (Insufficient Credits)
    if (error.response?.status === 402) {
      const data = error.response.data;
      if (data.error?.code === 'INSUFFICIENT_CREDITS') {
        toast.error(data.error.message || 'Krediniz yetersiz.', {
          duration: 5000,
          position: 'top-center'
        });
      }
    }

    return Promise.reject(error);
  }
);

export default client;
