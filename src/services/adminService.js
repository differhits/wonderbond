import { getToken } from './authService';
import { API_URLS } from './apiConfig';

const API = API_URLS.ADMIN;

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export const getAdminStatsAPI   = async () => {
  const res = await fetch(`${API}/stats`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.stats;
};

export const getAdminUsersAPI = async (searchOrObj = '', status = '') => {
  let search = '';
  let st = status;
  if (typeof searchOrObj === 'object' && searchOrObj !== null) {
    search = searchOrObj.search || '';
    st = searchOrObj.status || '';
  } else {
    search = searchOrObj || '';
  }
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (st) params.set('status', st);
  const res = await fetch(`${API}/users?${params}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.users || [];
};

export const suspendUserAPI     = async (id) => {
  const res = await fetch(`${API}/users/${id}/suspend`, { method: 'PUT', headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
};

export const verifyUserAPI      = async (id) => {
  const res = await fetch(`${API}/users/${id}/verify`, { method: 'PUT', headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
};

export const changeRoleAPI      = async (id, role) => {
  const res = await fetch(`${API}/users/${id}/role`, {
    method: 'PUT', headers: headers(), body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
};

export const deleteUserAPI      = async (id) => {
  const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getAdminMessagesAPI = async () => {
  const res = await fetch(`${API}/messages`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.messages || [];
};

