import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './client';
import type { User, AuthContextType } from './types.ts'

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await api.get<User | null>('/users/me/session');
				setUser(response.data ?? null);
 			} catch {
		  		setUser(null);
			} finally {
				setIsLoading(false);
			}
		};
		checkAuthStatus();
	}, []);

	const logout = async () => {
		try {
			await api.post('/auth/logout');
		} finally {
			setUser(null);
		}
	};

	const login = (userData: User) => {
		setUser({ ...userData });
		setIsLoading(false);
	};

	return (
    	<AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, login }}>
      		{children}
    	</AuthContext.Provider>
 	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
