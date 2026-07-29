import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  logout: () => void;
  login: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  const [profileChanged, setProfileChanged] = useState<boolean>(false);

  const login = (token: string) => {
    localStorage.setItem('access_token', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
  };

  const toggleProfileChanged = () => {
    setProfileChanged(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, profileChanged, toggleProfileChanged, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};