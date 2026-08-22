import { io } from 'socket.io-client';
import { getToken } from './authService';
import { SOCKET_URL } from './apiConfig';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected:', socket.id);
    // Apne aap ko online mark karo
    const token = getToken();
    if (token) socket.emit('user:online', token);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Message send karo via socket
export const sendSocketMessage = (receiverId, content) => {
  if (!socket?.connected) return;
  socket.emit('message:send', { receiverId, content });
};
