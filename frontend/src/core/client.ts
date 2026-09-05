import axios from 'axios';

export const api = axios.create({
	baseURL: '/api/v1',
	withCredentials: true,
});

// Unique parameter on each GET so the browser never serves it from cache
api.interceptors.request.use((config) => {
	if (config.method?.toLowerCase() === 'get') {
		config.params = { ...config.params, _t: Date.now() };
	}
	return config;
});

// Expired session, any 401 outside the login screen goes to /login
api.interceptors.response.use(
	(response) => response,
	(error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/users/me')) {
    	if (window.location.pathname !== '/login') {
        // Login reads returnTo after a successful sign in
    		sessionStorage.setItem('returnTo', window.location.pathname);
    		window.location.href = '/login?error=Session expired, please log in again.';
    	}
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return 'An unknown error occurred';
    }
    if (error.response) {
        let message = error.response.data?.message || error.response.data?.detail;
        if (Array.isArray(message)) {
            // A 422 sends detail as a list of objects, one per field
            message = message.map((item) => item?.msg ?? String(item)).join(', ');
        }
        if (message === 'Inactive user') {
            return 'Inactive user. Please check your email for the activation link.';
        }
        return typeof message === 'string' && message ? message : 'Unknown server error';
    }
    if (error.request) {
        return 'No response from server';
    }
    return error.message;
}