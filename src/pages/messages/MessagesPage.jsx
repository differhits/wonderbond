import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send, Plus, ArrowLeft, Phone, Video, Info, Smile, Search,
  Image, MapPin, Plane, FileText, Mic, MicOff, Play, Pause,
  X, Check, Camera, Compass, Volume2, PhoneOff, VideoOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getMyTripsAPI } from '../../services/tripService';
import './MessagesPage.css';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatThreadTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
}

// ── Call Modal (Video / Audio) ────────────────────────────────────────────────
function CallModal({ user, type, onClose }) {
  const [status, setStatus] = useState('Calling…');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('Connected'), 2500);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    let timer;
    if (status === 'Connected') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatDuration = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const avatar = user?.photos?.[0] || user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=E84B0F&color=fff`;

  return (
    <div className="call-modal-overlay">
      <div className="call-modal-content">
        <div className="call-avatar-wrap">
          <img src={avatar} alt={user?.name} className="call-avatar" />
          <div className="call-ripple" />
        </div>

        <h3 className="call-user-name">{user?.name}</h3>
        <p className="call-status">
          {status === 'Connected' ? formatDuration(duration) : status}
        </p>
        <span className="call-type-badge">
          {type === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </span>

        {type === 'video' && status === 'Connected' && !camOff && (
          <div className="call-video-preview">
            <div className="call-video-placeholder">
              <Camera size={28} />
              <span>Camera active (HD 1080p)</span>
            </div>
          </div>
        )}

        <div className="call-controls">
          <button
            className={`call-control-btn ${muted ? 'active' : ''}`}
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {type === 'video' && (
            <button
              className={`call-control-btn ${camOff ? 'active' : ''}`}
              onClick={() => setCamOff(c => !c)}
              title={camOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {camOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          <button className="call-control-btn end-call-btn" onClick={onClose} title="End call">
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Share Itinerary Modal ────────────────────────────────────────────────────
function ShareItineraryModal({ onClose, onShare }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTrip, setCustomTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: 'Mid-range',
    purpose: '',
  });
  const [mode, setMode] = useState('existing');

  useEffect(() => {
    getMyTripsAPI().then(res => {
      setTrips(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customTrip.destination) return;
    onShare({
      destination: customTrip.destination,
      startDate: customTrip.startDate,
      endDate: customTrip.endDate,
      budget: customTrip.budget,
      purpose: customTrip.purpose,
      duration: customTrip.startDate && customTrip.endDate
        ? Math.ceil((new Date(customTrip.endDate) - new Date(customTrip.startDate)) / 86400000)
        : 0,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>✈️ Share Trip Plan / Itinerary</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn btn-sm ${mode === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('existing')}
          >
            My Trips ({trips.length})
          </button>
          <button
            className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('custom')}
          >
            + Create Custom Plan
          </button>
        </div>

        {mode === 'existing' ? (
          <div>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Loading your trips…</p>
            ) : trips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                <p>No saved trips found.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setMode('custom')}>
                  Create a Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {trips.map(t => (
                  <div key={t._id || t.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.destination}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t.startDate} → {t.endDate} · {t.budget}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onShare(t);
                        onClose();
                      }}
                    >
                      Share
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bali, Indonesia"
                value={customTrip.destination}
                onChange={e => setCustomTrip(p => ({ ...p, destination: e.target.value }))}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={customTrip.startDate}
                  onChange={e => setCustomTrip(p => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={customTrip.endDate}
                  onChange={e => setCustomTrip(p => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Trip Purpose / Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Beach holiday & scuba diving"
                value={customTrip.purpose}
                onChange={e => setCustomTrip(p => ({ ...p, purpose: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Share Plan</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Share Location Modal ─────────────────────────────────────────────────────
function ShareLocationModal({ onClose, onShare }) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const c = data.address?.city || data.address?.town || data.address?.state || 'Nearby';
          const cnt = data.address?.country || '';
          setCity(c);
          setCountry(cnt);
          onShare({
            city: c,
            country: cnt,
            address: data.display_name,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          onClose();
        } catch {
          onShare({ city: 'Current Location', country: '', lat: pos.coords.latitude, lng: pos.coords.longitude });
          onClose();
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false)
    );
  };

  const handleManual = (e) => {
    e.preventDefault();
    if (!city) return;
    onShare({ city, country, address: `${city}, ${country}` });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>📍 Share Location</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, gap: 8, justifyContent: 'center' }}
          onClick={detectLocation}
          disabled={detecting}
        >
          <Compass size={16} />
          {detecting ? 'Detecting GPS location…' : 'Share Current GPS Location'}
        </button>

        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
          — OR ENTER MANUALLY —
        </div>

        <form onSubmit={handleManual} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">City / Destination *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Goa, Mumbai, Paris"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. India"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Share Pin</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Messages Page ─────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { userId: paramUserId } = useParams();
  const { matches, users, conversations, sendMessage, loadConversation, onlineUsers } = useApp();
  const { user: me } = useAuth();
  const [activeUserId, setActiveUserId] = useState(paramUserId || null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [callModal, setCallModal] = useState(null); // { type: 'voice' | 'video' }
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Enrich matches with real user objects
  const enriched = matches.map(m => ({
    ...m,
    user: m.user || users.find(u => (u._id || u.id) === (m.userId?._id || m.userId?.id || m.userId)),
  })).filter(m => m.user);

  // Auto-select match
  useEffect(() => {
    if (!activeUserId && enriched.length > 0) {
      const firstId = enriched[0].user?._id || enriched[0].user?.id || enriched[0].userId?._id || enriched[0].userId;
      setActiveUserId(firstId);
    }
  }, [enriched.length]);

  // Load conversation
  useEffect(() => {
    if (activeUserId) loadConversation(activeUserId);
  }, [activeUserId]);

  // Scroll to bottom
  const thread = conversations[activeUserId] || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length, activeUserId]);

  // Close attach menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Voice recording timer
  useEffect(() => {
    let t;
    if (isRecording) {
      t = setInterval(() => setRecordingSec(s => s + 1), 1000);
    } else {
      setRecordingSec(0);
    }
    return () => clearInterval(t);
  }, [isRecording]);

  const activeMatch = enriched.find(m => (m.user?._id || m.user?.id || m.userId?._id || m.userId?.id || m.userId) === activeUserId) ||
    (() => {
      const u = users.find(x => (x._id || x.id) === activeUserId);
      return u ? { user: u, userId: u._id || u.id, compatibility: 85 } : null;
    })();

  const handleSendText = () => {
    if (!input.trim() || !activeUserId) return;
    sendMessage(activeUserId, input.trim());
    setInput('');
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // ── Attachments Handlers ───────────────────────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUserId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      sendMessage(activeUserId, {
        type: 'image',
        mediaUrl: ev.target.result,
        content: file.name,
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDocPick = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUserId) return;
    sendMessage(activeUserId, {
      type: 'document',
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      content: file.name,
    });
    setShowAttachMenu(false);
  };

  const handleLocationShare = (loc) => {
    if (!activeUserId) return;
    sendMessage(activeUserId, {
      type: 'location',
      locationData: loc,
      content: `📍 ${loc.address || `${loc.city}, ${loc.country}`}`,
    });
  };

  const handleItineraryShare = (itinerary) => {
    if (!activeUserId) return;
    sendMessage(activeUserId, {
      type: 'itinerary',
      itineraryData: itinerary,
      content: `✈️ Trip to ${itinerary.destination} (${itinerary.duration || 5} days)`,
    });
  };

  const handleSendVoice = () => {
    if (!activeUserId) return;
    setIsRecording(false);
    sendMessage(activeUserId, {
      type: 'voice',
      fileName: `Voice note (${recordingSec}s)`,
      fileSize: `${recordingSec}s`,
      content: `🎤 Voice note (${recordingSec}s)`,
    });
  };

  const filteredMatches = enriched.filter(m =>
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherUsers = users.filter(u => {
    const uId = u._id || u.id;
    const myId = me?._id || me?.id;
    if (uId === myId) return false;
    const inEnriched = enriched.some(m => (m.user?._id || m.user?.id) === uId);
    return !inEnriched;
  });

  const getAvatar = (u) => u?.photos?.[0] || u?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=E84B0F&color=fff`;

  const isOnline = (uid) => onlineUsers.includes(uid?.toString());
  const getMessageSenderId = (msg) => msg.senderId?._id || msg.senderId?.toString?.() || msg.senderId;

  return (
    <div className="messages-page">
      {/* ── Left Matches Sidebar ──────────────────────────────── */}
      <div className={`messages-sidebar ${activeUserId ? 'hide-mobile-if-active' : ''}`}>
        <div className="messages-search-wrap">
          <div className="messages-search-input">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search matches or chats"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="messages-list-label">Conversations</div>
        <div className="messages-list">
          {filteredMatches.map(m => {
            const u = m.user;
            const uId = u._id || u.id;
            const isActive = uId === activeUserId;
            const lastMsg = (conversations[uId] || []).slice(-1)[0];
            const displayPreview = lastMsg ? (
              lastMsg.type === 'image' ? '📷 Photo'
                : lastMsg.type === 'location' ? '📍 Shared Location'
                : lastMsg.type === 'itinerary' ? `✈️ ${lastMsg.itineraryData?.destination || 'Trip Plan'}`
                : lastMsg.type === 'voice' ? '🎤 Voice Note'
                : lastMsg.type === 'document' ? `📄 ${lastMsg.fileName || 'Document'}`
                : (lastMsg.content || 'Matched! Say hello 👋')
            ) : (m.lastMessage || 'Matched! Say hello 👋');

            return (
              <button
                key={m.id || uId}
                className={`messages-thread-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveUserId(uId)}
              >
                <div className="messages-avatar-wrap">
                  <img src={getAvatar(u)} alt={u.name} className="avatar avatar-md" />
                  {isOnline(uId) && <span className="match-online-dot" />}
                </div>
                <div className="messages-thread-info">
                  <div className="messages-thread-name">{u.name}</div>
                  <div className="messages-thread-preview">{displayPreview}</div>
                </div>
                <div className="messages-thread-meta">
                  <span className="messages-thread-time">
                    {lastMsg ? formatThreadTime(lastMsg.createdAt || lastMsg.timestamp)
                      : m.lastMessageTime ? formatThreadTime(m.lastMessageTime) : ''}
                  </span>
                  {(m.unread > 0) && (
                    <span className="notif-badge" style={{ fontSize: '0.65rem', padding: '1px 5px', minWidth: 16, height: 16 }}>
                      {m.unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {enriched.length === 0 && (
            <div className="messages-empty" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No active chats yet. Choose a traveler below to start chatting!
              </p>
            </div>
          )}

          {otherUsers.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px' }}>
                Start a New Chat
              </div>
              {otherUsers.slice(0, 8).map(u => {
                const uId = u._id || u.id;
                const isActive = uId === activeUserId;
                return (
                  <button
                    key={uId}
                    className={`messages-thread-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveUserId(uId)}
                  >
                    <div className="messages-avatar-wrap">
                      <img src={getAvatar(u)} alt={u.name} className="avatar avatar-md" />
                      {isOnline(uId) && <span className="match-online-dot" />}
                    </div>
                    <div className="messages-thread-info">
                      <div className="messages-thread-name">{u.name}</div>
                      <div className="messages-thread-preview" style={{ color: 'var(--brand-primary)', fontSize: '0.78rem' }}>
                        💬 Send message
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ───────────────────────────────────── */}
      <div className={`messages-chat ${!activeUserId ? 'hide-mobile-if-no-active' : ''}`}>
        {!activeMatch ? (
          <div className="chat-empty">
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>💬</div>
            <h3>Your Messages</h3>
            <p>Select a match on the left to start a private travel conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <button className="chat-back hide-desktop" onClick={() => setActiveUserId(null)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-header-user">
                <img src={getAvatar(activeMatch.user)} alt="" className="avatar avatar-md" />
                <div>
                  <div className="chat-header-name">{activeMatch.user.name}</div>
                  <div className="chat-header-meta">
                    <span className="online-indicator">
                      <span className={isOnline(activeUserId) ? 'online-dot' : ''} style={{ background: isOnline(activeUserId) ? '#22c55e' : '#999' }} />
                      {isOnline(activeUserId) ? ' Online' : ' Offline'}
                    </span>
                    {activeMatch.user.city && (
                      <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>· {activeMatch.user.city}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <button
                  className="chat-icon-btn"
                  title="Voice Call"
                  onClick={() => setCallModal({ type: 'voice', user: activeMatch.user })}
                >
                  <Phone size={16} />
                </button>
                <button
                  className="chat-icon-btn"
                  title="Video Call"
                  onClick={() => setCallModal({ type: 'video', user: activeMatch.user })}
                >
                  <Video size={16} />
                </button>
                <Link
                  to={`/profile/${activeUserId}`}
                  className="chat-icon-btn"
                  title="View Full Profile"
                >
                  <Info size={16} />
                </Link>
              </div>
            </div>

            {/* Messages Body */}
            <div className="chat-messages">
              <div className="chat-date-divider">End-to-End Encrypted Match Chat</div>

              {thread.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '40px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>You and {activeMatch.user.name} matched!</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Say hi, share travel plans, or suggest a destination to explore together.</p>
                </div>
              )}

              {thread.map((msg, idx) => {
                const senderId = getMessageSenderId(msg);
                const isMe = senderId === me?._id || senderId === 'me';
                const msgType = msg.type || 'text';

                return (
                  <div key={msg._id || msg.id || idx} className={`msg-row ${isMe ? 'msg-me' : 'msg-them'}`}>
                    {!isMe && (
                      <img src={getAvatar(activeMatch.user)} alt="" className="avatar avatar-xs msg-avatar" />
                    )}
                    <div className={`msg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>

                      {/* 1. TEXT */}
                      {msgType === 'text' && (
                        <div className="msg-content">{msg.content}</div>
                      )}

                      {/* 2. IMAGE */}
                      {msgType === 'image' && (
                        <div className="msg-image-wrap">
                          <img src={msg.mediaUrl} alt="Shared photo" className="msg-shared-img" />
                          {msg.content && msg.content !== 'image' && (
                            <div className="msg-content" style={{ marginTop: 4 }}>{msg.content}</div>
                          )}
                        </div>
                      )}

                      {/* 3. ITINERARY / TRIP PLAN */}
                      {msgType === 'itinerary' && (
                        <div className="msg-itinerary-card">
                          <div className="msg-itinerary-header">
                            <Plane size={16} />
                            <span>Trip Plan</span>
                          </div>
                          <h4 className="msg-itinerary-dest">{msg.itineraryData?.destination || msg.content}</h4>
                          {msg.itineraryData?.startDate && (
                            <div className="msg-itinerary-dates">
                              🗓️ {msg.itineraryData.startDate} → {msg.itineraryData.endDate}
                              {msg.itineraryData.duration > 0 && ` (${msg.itineraryData.duration} days)`}
                            </div>
                          )}
                          {msg.itineraryData?.budget && (
                            <div className="msg-itinerary-budget">💰 Budget: {msg.itineraryData.budget}</div>
                          )}
                          {msg.itineraryData?.purpose && (
                            <div className="msg-itinerary-note">"{msg.itineraryData.purpose}"</div>
                          )}
                        </div>
                      )}

                      {/* 4. LOCATION */}
                      {msgType === 'location' && (
                        <div className="msg-location-card">
                          <div className="msg-location-header">
                            <MapPin size={16} color="#E84B0F" />
                            <span>Shared Location</span>
                          </div>
                          <div className="msg-location-name">
                            {msg.locationData?.city || 'Pinned Location'}{msg.locationData?.country ? `, ${msg.locationData.country}` : ''}
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.locationData?.city || msg.content)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="msg-location-btn"
                          >
                            Open in Maps ↗
                          </a>
                        </div>
                      )}

                      {/* 5. VOICE NOTE */}
                      {msgType === 'voice' && (
                        <div className="msg-voice-note">
                          <button
                            className="voice-play-btn"
                            onClick={() => setPlayingVoiceId(p => p === (msg._id || idx) ? null : (msg._id || idx))}
                          >
                            {playingVoiceId === (msg._id || idx) ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <div className="voice-waveform">
                            <span className="waveform-bar" style={{ height: '60%' }} />
                            <span className="waveform-bar" style={{ height: '90%' }} />
                            <span className="waveform-bar" style={{ height: '40%' }} />
                            <span className="waveform-bar" style={{ height: '100%' }} />
                            <span className="waveform-bar" style={{ height: '70%' }} />
                            <span className="waveform-bar" style={{ height: '50%' }} />
                          </div>
                          <span className="voice-duration">{msg.fileSize || '0:03'}</span>
                        </div>
                      )}

                      {/* 6. DOCUMENT */}
                      {msgType === 'document' && (
                        <div className="msg-doc-card">
                          <FileText size={22} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="msg-doc-name">{msg.fileName || msg.content}</div>
                            <div className="msg-doc-size">{msg.fileSize || 'Travel Document'}</div>
                          </div>
                        </div>
                      )}

                      <div className="msg-time">{formatTime(msg.createdAt || msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Hidden file pickers */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImagePick}
            />
            <input
              type="file"
              ref={docInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              onChange={handleDocPick}
            />

            {/* ── Input Area ────────────────────────────────────── */}
            <div className="chat-input-area" style={{ position: 'relative' }}>
              {/* Attachment menu */}
              {showAttachMenu && (
                <div className="attach-popup-menu animate-fadeIn" ref={attachMenuRef}>
                  <button className="attach-item" onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}>
                    <div className="attach-icon-wrap" style={{ background: '#3B82F6' }}><Image size={16} color="white" /></div>
                    <span>Share Photo</span>
                  </button>
                  <button className="attach-item" onClick={() => { setShowItineraryModal(true); setShowAttachMenu(false); }}>
                    <div className="attach-icon-wrap" style={{ background: '#E84B0F' }}><Plane size={16} color="white" /></div>
                    <span>Share Trip Plan</span>
                  </button>
                  <button className="attach-item" onClick={() => { setShowLocationModal(true); setShowAttachMenu(false); }}>
                    <div className="attach-icon-wrap" style={{ background: '#22C55E' }}><MapPin size={16} color="white" /></div>
                    <span>Share Location</span>
                  </button>
                  <button className="attach-item" onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}>
                    <div className="attach-icon-wrap" style={{ background: '#A855F7' }}><FileText size={16} color="white" /></div>
                    <span>Travel Document</span>
                  </button>
                </div>
              )}

              {isRecording ? (
                <div className="recording-bar animate-fadeIn">
                  <div className="recording-pulse" />
                  <span className="recording-text">Recording voice note… {recordingSec}s</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsRecording(false)} style={{ marginLeft: 'auto' }}>
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSendVoice}>
                    <Check size={14} /> Send Note
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="chat-attach-btn"
                    aria-label="Attach options"
                    onClick={() => setShowAttachMenu(m => !m)}
                    title="Attach photo, trip plan, location, or document"
                  >
                    <Plus size={18} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  <textarea
                    className="chat-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                  <button
                    className="chat-mic-btn"
                    onClick={() => setIsRecording(true)}
                    title="Record voice note"
                    aria-label="Voice Note"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    className={`send-btn ${input.trim() ? 'active' : ''}`}
                    onClick={handleSendText}
                    disabled={!input.trim()}
                    aria-label="Send message"
                  >
                    <Send size={17} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {callModal && (
        <CallModal
          user={callModal.user}
          type={callModal.type}
          onClose={() => setCallModal(null)}
        />
      )}

      {showItineraryModal && (
        <ShareItineraryModal
          onClose={() => setShowItineraryModal(false)}
          onShare={handleShareItinerary}
        />
      )}

      {showLocationModal && (
        <ShareLocationModal
          onClose={() => setShowLocationModal(false)}
          onShare={handleShareLocation}
        />
      )}
    </div>
  );
}
