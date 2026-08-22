import { getToken } from './authService';
import { API_URLS } from './apiConfig';

const API_URL = API_URLS.MESSAGES;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// Current user ke saare active message threads fetch karo
export const getMyThreadsAPI = async () => {
  const res = await fetch(`${API_URL}/threads`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch threads');
  return data.threads || [];
};

// Kisi user ke saath conversation fetch karo
export const getConversationAPI = async (userId) => {
  const res = await fetch(`${API_URL}/${userId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
  return data.messages;
};

// Message send karo (REST fallback)
export const sendMessageAPI = async (receiverId, content) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ receiverId, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send message');
  return data.message;
};
