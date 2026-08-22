const dns = require('dns');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

// ISP DNS SRV block fix — Google DNS use karo
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// .env file load karo
dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins helper
const getAllowedOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ];
  if (process.env.CLIENT_URL) {
    const custom = process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''));
    return [...defaults, ...custom];
  }
  return defaults;
};

// ── Socket.io setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Online users map: userId → socketId
const onlineUsers = new Map();

// Export so other modules can emit to connected users
const getIO = () => io;
const getOnlineUsers = () => onlineUsers;

io.on('connection', (socket) => {
  console.log('🔌 New socket connected:', socket.id);

  // User online ho gaya
  socket.on('user:online', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name');
      if (!user) return;
      onlineUsers.set(user._id.toString(), socket.id);
      socket.userId = user._id.toString();
      console.log(`✅ ${user.name} is online`);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    } catch (err) {
      console.error('Socket auth error:', err.message);
    }
  });

  // Message send karo
  socket.on('message:send', async ({ receiverId, content, type = 'text', mediaUrl = '', fileName = '', fileSize = '', locationData = null, itineraryData = null }) => {
    try {
      if (!socket.userId) return;

      // MongoDB mein save karo
      const msg = await Message.create({
        senderId: socket.userId,
        receiverId,
        content: content || '',
        type,
        mediaUrl,
        fileName,
        fileSize,
        locationData,
        itineraryData,
      });

      const populatedMsg = await msg.populate('senderId', 'name photos avatar');

      // Receiver ko real-time deliver karo
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('message:receive', populatedMsg);
      }

      // Sender ko confirm karo
      socket.emit('message:sent', populatedMsg);
    } catch (err) {
      socket.emit('message:error', err.message);
    }
  });


  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`❌ User ${socket.userId} went offline`);
    }
  });
});

// ── Express Middleware ─────────────────────────────────────────────────────
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, mobile or curl requests without origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Check if matching domain
    if (allowedOrigins.some(a => origin.startsWith(a))) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/users',   require('./routes/userRoutes'));
app.use('/api/messages',require('./routes/messageRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));
app.use('/api/trips',   require('./routes/tripRoutes'));


// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 WonderBond Backend is running!' });
});

// ── MongoDB Connect ─────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⚡ Socket.io ready for real-time chat!`);
  });
});

module.exports = { getIO, getOnlineUsers };
