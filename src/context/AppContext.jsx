import { createContext, useContext, useState, useEffect } from 'react';
import { getUsersAPI } from '../services/userService';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user: currentUser } = useAuth();
  const userId = currentUser?._id || currentUser?.id || null;

  // ── Real / Dummy users pool from backend for testing & discovery ──────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ── Dynamic user-scoped state (0 for new users until they interact) ───────
  const [matches, setMatchesState] = useState([]);
  const [notifications, setNotificationsState] = useState([]);
  const [savedProfiles, setSavedProfilesState] = useState([]);
  const [myTrips, setMyTripsState] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // ── Real messages from Socket.io + backend ──────────────────────────────
  const [conversations, setConversations] = useState({}); // { userId: [msgs] }

  // ── Sync user-specific state when active user changes ────────────────────
  useEffect(() => {
    if (!userId) {
      setMatchesState([]);
      setNotificationsState([]);
      setSavedProfilesState([]);
      setMyTripsState([]);
      setUserLocation(null);
      setConversations({});
      return;
    }

    // Clean up legacy global keys so they never pollute new accounts
    try {
      localStorage.removeItem('wb_matches_v2');
      localStorage.removeItem('wb_notifications_v2');
      localStorage.removeItem('wb_saved_v2');
    } catch {}

    // 1. Matches for current user
    try {
      const savedMatches = localStorage.getItem(`wb_matches_${userId}`);
      setMatchesState(savedMatches ? JSON.parse(savedMatches) : []);
    } catch {
      setMatchesState([]);
    }

    // 2. Notifications for current user (fresh welcome message if empty)
    try {
      const savedNotifs = localStorage.getItem(`wb_notifications_${userId}`);
      if (savedNotifs) {
        setNotificationsState(JSON.parse(savedNotifs));
      } else {
        const welcome = [
          {
            id: `notif_welcome_${Date.now()}`,
            type: 'system',
            message: `👋 Welcome to WonderBond, ${currentUser?.name || 'Traveler'}! Discover fellow travelers and swipe to connect.`,
            timestamp: new Date().toISOString(),
            read: false,
          },
        ];
        setNotificationsState(welcome);
        localStorage.setItem(`wb_notifications_${userId}`, JSON.stringify(welcome));
      }
    } catch {
      setNotificationsState([]);
    }

    // 3. Saved profiles for current user
    try {
      const saved = localStorage.getItem(`wb_saved_${userId}`);
      setSavedProfilesState(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedProfilesState([]);
    }

    // 4. Trips for current user
    try {
      const trips = localStorage.getItem(`wb_myTrips_${userId}`);
      setMyTripsState(trips ? JSON.parse(trips) : []);
    } catch {
      setMyTripsState([]);
    }

    // 5. Location
    try {
      const loc = localStorage.getItem(`wb_loc_${userId}`);
      setUserLocation(loc ? JSON.parse(loc) : null);
    } catch {
      setUserLocation(null);
    }
  }, [userId, currentUser?.name]);

  // ── Persistence Helpers for Current User ──────────────────────────────────
  const setMatches = (updater) => {
    setMatchesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        try { localStorage.setItem(`wb_matches_${userId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const setNotifications = (updater) => {
    setNotificationsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        try { localStorage.setItem(`wb_notifications_${userId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const setSavedProfiles = (updater) => {
    setSavedProfilesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        try { localStorage.setItem(`wb_saved_${userId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const setMyTrips = (updater) => {
    setMyTripsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        try { localStorage.setItem(`wb_myTrips_${userId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  // ── Fetch users pool & connect socket on login ───────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      disconnectSocket();
      return;
    }

    // Fetch users (dummy + real users) & real message threads
    const fetchInitialData = async () => {
      setUsersLoading(true);
      try {
        const [usersData, threadsData] = await Promise.allSettled([
          getUsersAPI(),
          import('../services/messageService').then(m => m.getMyThreadsAPI()),
        ]);

        if (usersData.status === 'fulfilled' && Array.isArray(usersData.value)) {
          setUsers(usersData.value);
        }

        if (threadsData.status === 'fulfilled' && Array.isArray(threadsData.value)) {
          const dbThreads = threadsData.value;
          if (dbThreads.length > 0) {
            setMatchesState((prevMatches) => {
              const merged = [...prevMatches];
              for (const thread of dbThreads) {
                const idx = merged.findIndex(
                  m => (m.userId?._id || m.userId?.id || m.userId) === thread.userId
                );
                if (idx >= 0) {
                  merged[idx] = {
                    ...merged[idx],
                    ...thread,
                    lastMessage: thread.lastMessage || merged[idx].lastMessage,
                    lastMessageTime: thread.lastMessageTime || merged[idx].lastMessageTime,
                    unread: thread.unread ?? merged[idx].unread,
                  };
                } else {
                  merged.unshift(thread);
                }
              }
              if (userId) {
                try { localStorage.setItem(`wb_matches_${userId}`, JSON.stringify(merged)); } catch {}
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.error('Could not fetch initial data:', err.message);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchInitialData();

    // Connect socket
    const socket = connectSocket();

    // Online users update
    socket.on('users:online', (ids) => setOnlineUsers(ids));

    // Incoming real-time message
    socket.on('message:receive', (msg) => {
      const senderId = msg.senderId?._id || msg.senderId;
      const senderName = msg.senderId?.name || 'Someone';

      setConversations((prev) => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), msg],
      }));

      const preview = msg.type === 'image' ? '📷 Photo'
        : msg.type === 'location' ? '📍 Shared Location'
        : msg.type === 'itinerary' ? `✈️ Trip: ${msg.itineraryData?.destination || 'Itinerary'}`
        : msg.type === 'voice' ? '🎤 Voice Note'
        : msg.type === 'document' ? `📄 ${msg.fileName || 'Document'}`
        : msg.content;

      // Update / add to matches thread list dynamically
      setMatchesState((prev) => {
        const idx = prev.findIndex(m => (m.userId?._id || m.userId?.id || m.userId) === senderId);
        let updated;
        if (idx >= 0) {
          updated = prev.map((m, i) => i === idx ? {
            ...m,
            lastMessage: preview,
            lastMessageTime: msg.createdAt || new Date().toISOString(),
            unread: (m.unread || 0) + 1,
          } : m);
        } else {
          updated = [{
            id: `conv_${senderId}`,
            userId: senderId,
            user: typeof msg.senderId === 'object' ? msg.senderId : null,
            lastMessage: preview,
            lastMessageTime: msg.createdAt || new Date().toISOString(),
            unread: 1,
            status: 'active',
            compatibility: 85,
          }, ...prev];
        }
        if (userId) {
          try { localStorage.setItem(`wb_matches_${userId}`, JSON.stringify(updated)); } catch {}
        }
        return updated;
      });

      // Message notification
      addNotification({
        type: 'message',
        message: `New message from ${senderName}: "${preview.slice(0, 30)}"`,
        userId: senderId,
      });
    });

    // Sent confirm
    socket.on('message:sent', (msg) => {
      const receiverId = msg.receiverId?.toString?.() || msg.receiverId;
      setConversations((prev) => ({
        ...prev,
        [receiverId]: [...(prev[receiverId] || []), msg],
      }));

      const preview = msg.type === 'image' ? '📷 Photo'
        : msg.type === 'location' ? '📍 Shared Location'
        : msg.type === 'itinerary' ? `✈️ Trip: ${msg.itineraryData?.destination || 'Itinerary'}`
        : msg.type === 'voice' ? '🎤 Voice Note'
        : msg.type === 'document' ? `📄 ${msg.fileName || 'Document'}`
        : msg.content;

      setMatchesState((prev) => {
        const idx = prev.findIndex(m => (m.userId?._id || m.userId?.id || m.userId) === receiverId);
        let updated;
        if (idx >= 0) {
          updated = prev.map((m, i) => i === idx ? {
            ...m,
            lastMessage: preview,
            lastMessageTime: msg.createdAt || new Date().toISOString(),
          } : m);
        } else {
          updated = [{
            id: `conv_${receiverId}`,
            userId: receiverId,
            lastMessage: preview,
            lastMessageTime: msg.createdAt || new Date().toISOString(),
            unread: 0,
            status: 'active',
            compatibility: 85,
          }, ...prev];
        }
        if (userId) {
          try { localStorage.setItem(`wb_matches_${userId}`, JSON.stringify(updated)); } catch {}
        }
        return updated;
      });
    });

    // Verification status change from admin
    socket.on('user:verified', (data) => {
      addNotification({
        type: 'verification',
        message: data.verified
          ? '✅ Your profile has been verified by the WonderBond team!'
          : 'Your profile verification was removed.',
      });
    });

    return () => {
      socket.off('users:online');
      socket.off('message:receive');
      socket.off('message:sent');
      socket.off('user:verified');
    };
  }, [currentUser]);

  // ── Matches: Add new match dynamically ────────────────────────────────────
  const addMatch = (targetUserId) => {
    const exists = matches.find((m) => m.userId === targetUserId);
    if (exists) return;
    const matchedUser = users.find((u) => u._id === targetUserId || u.id === targetUserId);
    const newMatch = {
      id: `m_${Date.now()}`,
      userId: targetUserId,
      matchedAt: new Date().toISOString(),
      compatibility: Math.floor(Math.random() * 25) + 72,
      status: 'active',
      lastMessage: null,
      lastMessageTime: null,
    };
    setMatches((prev) => [newMatch, ...prev]);
    addNotification({
      type: 'match',
      message: `You matched with ${matchedUser?.name || 'someone'}! 🎉`,
      avatar: matchedUser?.photos?.[0] || matchedUser?.avatar || null,
      userId: targetUserId,
    });
  };

  // ── Send Message via Socket ───────────────────────────────────────────────
  const sendMessage = (receiverId, payload) => {
    const isObj = typeof payload === 'object' && payload !== null;
    const content = isObj ? payload.content : payload;
    const type = isObj ? (payload.type || 'text') : 'text';
    const mediaUrl = isObj ? (payload.mediaUrl || '') : '';
    const fileName = isObj ? (payload.fileName || '') : '';
    const fileSize = isObj ? (payload.fileSize || '') : '';
    const locationData = isObj ? (payload.locationData || null) : null;
    const itineraryData = isObj ? (payload.itineraryData || null) : null;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('message:send', {
        receiverId,
        content,
        type,
        mediaUrl,
        fileName,
        fileSize,
        locationData,
        itineraryData,
      });
    }

    const preview = type === 'image' ? '📷 Photo'
      : type === 'location' ? '📍 Shared Location'
      : type === 'itinerary' ? `✈️ Trip: ${itineraryData?.destination || 'Itinerary'}`
      : type === 'voice' ? '🎤 Voice Note'
      : type === 'document' ? `📄 ${fileName || 'Document'}`
      : content;

    // Update last message in match
    setMatches((prev) =>
      prev.map((m) =>
        m.userId === receiverId
          ? { ...m, lastMessage: preview, lastMessageTime: new Date().toISOString() }
          : m
      )
    );
  };

  // ── Load conversation history from backend ────────────────────────────────
  const loadConversation = async (targetUserId) => {
    try {
      const { getConversationAPI } = await import('../services/messageService');
      const msgs = await getConversationAPI(targetUserId);
      setConversations((prev) => ({ ...prev, [targetUserId]: msgs }));
    } catch (err) {
      console.error('Could not load conversation:', err.message);
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const addNotification = (notif) => {
    const newNotif = {
      id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
  };

  const markNotificationsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markOneRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const clearAllNotifications = () => setNotifications([]);

  // ── Saved Profiles ────────────────────────────────────────────────────────
  const toggleSaveProfile = (targetUserId) => {
    setSavedProfiles((prev) =>
      prev.includes(targetUserId)
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId]
    );
  };

  // ── Trips ─────────────────────────────────────────────────────────────────
  const addTrip = (trip) => {
    const newTrip = { ...trip, id: `mt_${Date.now()}`, userId: currentUser?._id || 'me' };
    setMyTrips((prev) => [...prev, newTrip]);
    addNotification({
      type: 'tripInvite',
      message: `✈️ New trip "${trip.title || trip.destination || 'Trip'}" created! Invite companions.`,
    });
  };

  const deleteTrip = (tripId) =>
    setMyTrips((prev) => prev.filter((t) => t.id !== tripId));

  // ── Location ──────────────────────────────────────────────────────────────
  const saveUserLocation = (loc) => {
    setUserLocation(loc);
    if (userId) {
      try { localStorage.setItem(`wb_loc_${userId}`, JSON.stringify(loc)); } catch {}
    }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessages = matches.reduce((sum, m) => sum + (m.unread || 0), 0);

  return (
    <AppContext.Provider
      value={{
        users,
        usersLoading,
        onlineUsers,
        matches,
        conversations,
        notifications,
        savedProfiles,
        myTrips,
        userLocation,
        addMatch,
        sendMessage,
        loadConversation,
        addNotification,
        markNotificationsRead,
        markOneRead,
        clearAllNotifications,
        toggleSaveProfile,
        addTrip,
        deleteTrip,
        saveUserLocation,
        unreadCount,
        unreadMessages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export default AppContext;
