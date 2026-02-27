import axios from 'axios';
import { SendOTPResponse, OTPVerificationResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Send OTP verification code to guest email
 */
export const sendOTP = async (email: string): Promise<SendOTPResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/guest/send-code`, {
      email,
      purpose: 'booking'
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to send verification code. Please try again.');
  }
};

/**
 * Verify OTP code and get guest token
 */
export const verifyOTP = async (email: string, code: string): Promise<OTPVerificationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/guest/verify-code`, {
      email,
      code
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Invalid or expired code. Please try again.');
  }
};

/**
 * Clear guest token from localStorage
 */
export const clearGuestToken = (): void => {
  localStorage.removeItem('guestToken');
  localStorage.removeItem('guestEmail');
};

/**
 * Get guest token from localStorage
 */
export const getGuestToken = (): string | null => {
  return localStorage.getItem('guestToken');
};

/**
 * Get guest email from localStorage
 */
export const getGuestEmail = (): string | null => {
  return localStorage.getItem('guestEmail');
};

/**
 * Decode JWT token payload (without verification - client-side only)
 */
const decodeToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true; // Invalid token is considered expired
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Check if user has a valid guest token
 */
export const hasGuestToken = (): boolean => {
  const token = localStorage.getItem('guestToken');
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    clearGuestToken(); // Auto-clear expired token
    return false;
  }
  
  return true;
};
