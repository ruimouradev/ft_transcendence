import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../client';

// interface AuthContextType {
//   isLoggedIn: boolean;
//   logout: () => void;
//   login: (token: string) => void;
// }

interface User {
  id: number;
  email: string;
  full_name: string;
  avatar: string;
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

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileChanged, setProfileChanged] = useState<boolean>(false);

  // Check login status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Request current user info using HttpOnly cookie
        const response = await api.get<User>('/users/me');
        setUser(response.data);
      } catch (error) {
        // 401 Unauthorized or network error = user is not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Endpoint that clears the HttpOnly cookie
    } finally {
      setUser(null);
    }
  };

  const login = (userData: User) => {
    setUser({...userData});
    setIsLoading(false);
  }
  
  const toggleProfileChanged = () => {
    setProfileChanged(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
//     return Boolean(localStorage.getItem('access_token'));
//   });

//   const [profileChanged, setProfileChanged] = useState<boolean>(false);

//   const login = (token: string) => {
//     localStorage.setItem('access_token', token);
//     setIsLoggedIn(true);
//   };

//   const logout = () => {
//     localStorage.removeItem('access_token');
//     setIsLoggedIn(false);
//   };

//   const toggleProfileChanged = () => {
//     setProfileChanged(prev => !prev);
//   };

//   return (
//     <AuthContext.Provider value={{ isLoggedIn, profileChanged, toggleProfileChanged, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// };