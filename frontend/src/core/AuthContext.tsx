import React, { createContext, useContext, useState, useEffect } from 'react';

import { api } from './client';

// A conta com sessão aberta, tal como o backend a devolve em /users/me.
export interface User {
  id: string;
  email: string;
  nick_name: string;
  avatar: string;
  card_back: string | null;
  is_superuser: boolean;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (userData: User) => void;
}

// Este contexto é a única fonte de verdade sobre "quem está logado".
// O token em si nunca passa por aqui: vive num cookie http only que o
// browser anexa sozinho a cada pedido, e por isso o arranque da app
// pergunta ao servidor quem somos em vez de ler storage nenhum.
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // isLoading cobre o instante entre abrir a app e a resposta do /me.
  // Sem ele, as rotas protegidas expulsavam quem ainda nem foi lido.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get<User>('/users/me');
        setUser(response.data);
      } catch {
        // 401 ou rede em baixo significam o mesmo aqui: ninguém logado
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const logout = async () => {
    try {
      // O servidor apaga o cookie httponly, que o JS não consegue tocar
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  // Chamado no fim do login e também para refrescar o user em memória
  // depois de editar o perfil (avatar, nome, verso das cartas).
  const login = (userData: User) => {
    setUser({ ...userData });
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, logout, login }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// o hook vive aqui ao lado do provider de propósito, é mais simples
// de encontrar. O aviso do fast refresh aceita-se.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
