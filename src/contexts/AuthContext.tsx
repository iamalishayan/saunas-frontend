import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../services/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Helper function to ensure user object has all required fields
  const normalizeUser = (userData: any): User => ({
    _id: userData._id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    isActive: userData.isActive ?? true,
    isStaff: userData.isStaff ?? (userData.role === 'staff' || userData.role === 'admin'),
    isEmailVerified: userData.isEmailVerified ?? false,
    createdAt: userData.createdAt ?? new Date().toISOString(),
    updatedAt: userData.updatedAt ?? new Date().toISOString(),
    phone: userData.phone
  });

  // Check for existing session on mount and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          // Validate token by fetching current user
          const currentUser = await getCurrentUser();
          setUser(normalizeUser(currentUser));
        } catch (err) {
          console.error('Token validation failed:', err);
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          setUser(null);
        }
      } else {
        // Check for legacy token format
        const legacyToken = localStorage.getItem('authToken');
        if (legacyToken) {
          try {
            const currentUser = await getCurrentUser();
            setUser(normalizeUser(currentUser));
          } catch (err) {
            console.error('Legacy token validation failed:', err);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setUser(null);
          }
        }
      }
      
      setIsLoading(false); // Authentication check complete
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await apiLogin(credentials);
       
      // Convert response to User format
      const user: User = normalizeUser({
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role
      });
      
      // Store new tokens (accessToken and refreshToken from enhanced backend)
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      } else {
        // Fallback for old token format
        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('authToken', response.token); // Keep legacy for compatibility
      }
      
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Clear any guest tokens when admin/user logs in
      localStorage.removeItem('guestToken');
      localStorage.removeItem('guestEmail');
      
      // Update state immediately
      setUser(user);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiRegister(userData);
      
      // Registration successful but don't auto-login
      // User needs to manually log in after registration
      
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      await apiLogout();
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken'); // Legacy cleanup
      localStorage.removeItem('userData');
      
      setUser(null);
      setError(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}