import { getToken } from './authService';
import { API_URLS } from './apiConfig';

const API_URL = API_URLS.USERS;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// Discover ke liye saare users
export const getUsersAPI = async () => {
  const res = await fetch(API_URL, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data.users;
};

// Ek user ki profile by ID
export const getUserByIdAPI = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'User not found');
  return data.user;
};

// Profile update (onboarding + edit profile)
export const updateProfileAPI = async (updates) => {
  const res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Profile update failed');
  return data.user;
};

// Account deletion
export const deleteMyAccountAPI = async () => {
  const res = await fetch(`${API_URL}/me`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete account');
  return data;
};

// Real Phone OTP Send via Backend Service
export const sendBackendOtpAPI = async (phone) => {
  const res = await fetch(`${API_URL}/otp/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
};

// Real Phone OTP Verify via Backend Service
export const verifyBackendOtpAPI = async (otp, phone) => {
  const res = await fetch(`${API_URL}/otp/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ otp, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to verify OTP');
  return data;
};
