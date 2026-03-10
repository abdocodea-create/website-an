import axios from 'axios';
import { useAuthStore } from '../stores/auth-store';

// IMPORTANT: When testing on physical device or emulator
// Replace 'localhost' with your computer's IP address
// Find your IP: Run 'ipconfig' in cmd (Windows) or 'ifconfig' in terminal (Mac/Linux)
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api', // 10.0.2.2 for Android emulator
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    async (error) => {
        console.error('API Error:', error.response?.status, error.config?.url, error.message);

        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            originalRequest._retry = true;

            try {
                const { data } = await api.post('/auth/refresh');
                useAuthStore.getState().setAccessToken(data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
