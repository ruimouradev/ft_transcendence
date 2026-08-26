import axios from 'axios';

// O eixo de todas as chamadas HTTP ao backend. Importa-se `api` em vez
// de usar axios diretamente, para todos os pedidos partilharem três
// comportamentos: o prefixo /api/v1, o cookie de sessão (withCredentials)
// e a reação a sessões expiradas.
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  // headers: {
  //   // Impede o browser de servir respostas antigas da cache dele
  //   'Cache-Control': 'no-cache, no-store, must-revalidate',
  //   'Pragma': 'no-cache',
  //   'Expires': '0',
  // },
});

// Acrescenta um parâmetro único a cada GET pela mesma razão: dois GETs
// iguais em momentos diferentes devem ir mesmo ao servidor.
api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
});

// Sessão caducou (o cookie tem 30 minutos): qualquer 401 fora do ecrã
// de login manda a pessoa para o login. As páginas não precisam de
// tratar este caso uma a uma.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/users/me')) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
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
        const message = error.response.data?.message|| error.response.data?.detail;
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