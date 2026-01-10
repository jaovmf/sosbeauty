import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Função para obter URL da API (mesma lógica do api.ts)
const getApiUrl = () => {
  // Se houver variável de ambiente VITE_API_URL, usar ela (produção)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL;
  }

  // Para desenvolvimento, detectar se estamos acessando via IP da rede
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // IPs específicos da rede local
    if (hostname === '192.168.1.7' || hostname === '192.168.1.9') {
      return `http://${hostname}:3003/api`;
    }

    // Qualquer outro IP
    if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      return `http://${hostname}:3003/api`;
    }
  }

  return 'http://localhost:3003/api';
};

const API_URL = getApiUrl();

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'gerente' | 'vendedor' | 'visualizador';
  roleName: string;
  avatar?: string;
  phone?: string;
  ativo: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createFirstUser: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Configurar interceptor do axios para sempre incluir o token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('@SOSBeauty:token');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Configurar axios com token
  useEffect(() => {
    const storedToken = localStorage.getItem('@SOSBeauty:token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Carregar dados do usuário
  const loadUserData = async () => {
    try {
      const storedToken = localStorage.getItem('@SOSBeauty:token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      setUsuario(response.data.usuario);
      setToken(storedToken);
    } catch (error: any) {
      console.error('Erro ao carregar dados do usuário:', error);

      // Se o token é inválido ou expirado, fazer logout
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token: newToken, usuario: userData } = response.data;

      setToken(newToken);
      setUsuario(userData);

      // Salvar no localStorage
      localStorage.setItem('@SOSBeauty:token', newToken);
      localStorage.setItem('@SOSBeauty:usuario', JSON.stringify(userData));

      // Configurar header padrão do axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success(`Bem-vindo(a), ${userData.name}!`);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);

      const errorMessage = error.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
      toast.error(errorMessage);

      throw error;
    }
  };

  // Logout
  const logout = () => {
    try {
      // Chamar endpoint de logout (opcional, para limpar cookies)
      axios.post(`${API_URL}/auth/logout`).catch(() => {});
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar estado
      setUsuario(null);
      setToken(null);

      // Limpar localStorage
      localStorage.removeItem('@SOSBeauty:token');
      localStorage.removeItem('@SOSBeauty:usuario');

      // Remover header de autorização
      delete axios.defaults.headers.common['Authorization'];

      toast.success('Logout realizado com sucesso!');
    }
  };

  // Criar primeiro usuário (Super Admin)
  const createFirstUser = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/first-user`, {
        name,
        email,
        password
      });

      const { token: newToken, usuario: userData } = response.data;

      setToken(newToken);
      setUsuario(userData);

      // Salvar no localStorage
      localStorage.setItem('@SOSBeauty:token', newToken);
      localStorage.setItem('@SOSBeauty:usuario', JSON.stringify(userData));

      // Configurar header padrão do axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('Super Admin criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar primeiro usuário:', error);

      const errorMessage = error.response?.data?.error || 'Erro ao criar usuário. Tente novamente.';
      toast.error(errorMessage);

      throw error;
    }
  };

  const isAuthenticated = !!token && !!usuario;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        createFirstUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
