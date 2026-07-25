import axios from 'axios';
import { cookieUtils, COOKIE_NAMES } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = cookieUtils.get(COOKIE_NAMES.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = cookieUtils.get(COOKIE_NAMES.REFRESH_TOKEN);
        const userId = cookieUtils.get(COOKIE_NAMES.USER_ID);
        if (refreshToken && userId) {
          const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {
            id: userId,
            refreshToken: refreshToken
          }, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Обновляем cookies
          cookieUtils.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, 7); // 7 дней
          cookieUtils.set(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, 30); // 30 дней
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Удаляем все cookies при ошибке refresh
        cookieUtils.remove(COOKIE_NAMES.ACCESS_TOKEN);
        cookieUtils.remove(COOKIE_NAMES.REFRESH_TOKEN);
        cookieUtils.remove(COOKIE_NAMES.USER_ID);
        
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
