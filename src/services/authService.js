import { API_URLS } from './apiConfig';

const API_URL = API_URLS.AUTH;

// Token localStorage mein save/get/remove
export const saveToken = (token) => localStorage.setItem('wb_token', token);
export const getToken = () => localStorage.getItem('wb_token');
export const removeToken = () => localStorage.removeItem('wb_token');

// Helper to handle fetch network failures
const handleFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please make sure the backend server is running.');
    }
    throw error;
  }
};

// Register
export const registerAPI = async (name, email, password) => {
  return handleFetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
};

// Login
export const loginAPI = async (email, password) => {
  return handleFetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
};

// Google Login
export const googleLoginAPI = async (idToken) => {
  return handleFetch(`${API_URL}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
};

// Get current user from token
export const getMeAPI = async () => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      removeToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('getMeAPI error:', error.message);
    return null;
  }
};

