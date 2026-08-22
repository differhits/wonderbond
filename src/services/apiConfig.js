// ══════════════════════════════════════════════════════════════════════════════
// WonderBond - Centralized API & Socket Configuration
// ══════════════════════════════════════════════════════════════════════════════

// In production, configure VITE_API_URL in your hosting environment (e.g., Vercel, Netlify)
// Example VITE_API_URL=https://your-backend-api.onrender.com
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = RAW_API.replace(/\/+$/, '');

export const API_URLS = {
  AUTH: `${API_BASE}/api/auth`,
  USERS: `${API_BASE}/api/users`,
  MESSAGES: `${API_BASE}/api/messages`,
  TRIPS: `${API_BASE}/api/trips`,
  ADMIN: `${API_BASE}/api/admin`,
};

// Socket server URL (same as backend server origin)
const RAW_SOCKET = import.meta.env.VITE_SOCKET_URL || RAW_API;
export const SOCKET_URL = RAW_SOCKET.replace(/\/+$/, '');
