import { useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(normalizeUser(parsedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
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
      
      // Store token and user data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Update state immediately
      setUser(user);
      
      // Ensure state is properly set before resolving
      // Small delay to allow React to process state updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
      // This ensures they confirm their credentials work
      
      // Don't store token or set user state
      // Just return success so the component can show success message
      
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear state
    setUser(null);
    setError(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};
