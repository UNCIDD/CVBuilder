'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuthToken, removeAuthToken } from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  logout: () => {},
  refreshAuth: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const token = await getAuthToken();
    setToken(token);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshAuth();
      setIsLoading(false);
    };
    initializeAuth();
  }, [refreshAuth]);

  const logout = () => {
    removeAuthToken();
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isLoading,
        token,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);