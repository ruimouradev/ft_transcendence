import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
//   headers: {
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//     'Pragma': 'no-cache',
//     'Expires': '0',
//   },
});

api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }
  return config;
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export function getErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return 'An unknown error occurred';
    }
    if (error.response) {
        const message = error.response.data?.message;
        if (message === 'Inactive user') {
            return 'Inactive user. Please check your email for the activation link.';
        }
        return message || 'Unknown server error';
    }
    if (error.request) {
        return 'No response from server';
    }
    return error.message;
}