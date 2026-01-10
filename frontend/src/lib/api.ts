import axios from 'axios';

// Configuração base do cliente Axios
const getApiUrl = () => {
  // Se houver variável de ambiente VITE_API_URL, usar ela (produção)
  if (import.meta.env.VITE_API_URL) {
    console.log('📡 API URL (produção):', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Para desenvolvimento, detectar se estamos acessando via IP da rede
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🌐 Hostname detectado:', hostname);

    // IPs específicos da rede local
    if (hostname === '192.168.1.7' || hostname === '192.168.1.9') {
      const apiUrl = `http://${hostname}:3003/api`;
      console.log('📡 API URL (IP específico):', apiUrl);
      return apiUrl;
    }

    // Qualquer outro IP
    if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      const apiUrl = `http://${hostname}:3003/api`;
      console.log('📡 API URL (qualquer IP):', apiUrl);
      return apiUrl;
    }
  }

  console.log('📡 API URL (localhost):', 'http://localhost:3003/api');
  return 'http://localhost:3003/api';
};

const apiUrl = getApiUrl();
console.log('🔧 Configurando axios com baseURL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@SOSBeauty:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para response (tratar erros globalmente)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export default api;