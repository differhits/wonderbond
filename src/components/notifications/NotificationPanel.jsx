import { useEffect, useRef } from 'react';
import { X, Bell, Heart, MessageCircle, Star, CheckCircle, MapPin, Trash2, Plane, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import './NotificationPanel.css';

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function groupByDate(notifications) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Earlier: [] };

  notifications.forEach(n => {
    const d = new Date(n.timestamp);
    if (d.toDateString() === today.toDateString()) groups.Today.push(n);
    else if (d.toDateString() === yesterday.toDateString()) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });

  return groups;
}

const NOTIF_ICONS = {
  match:              { icon: Heart,        color: '#ff6584', bg: 'rgba(255,101,132,0.15)' },
  message:            { icon: MessageCircle,color: '#6c63ff', bg: 'rgba(108,99,255,0.15)' },
  like:               { icon: Star,         color: '#ffbe0b', bg: 'rgba(255,190,11,0.15)' },
  superlike:          { icon: Star,         color: '#6c63ff', bg: 'rgba(108,99,255,0.15)' },
  review:             { icon: CheckCircle,  color: '#43e97b', bg: 'rgba(67,233,123,0.15)' },
  location:           { icon: MapPin,       color: '#1e90ff', bg: 'rgba(30,144,255,0.15)' },
  tripInvite:         { icon: Plane,        color: '#E84B0F', bg: 'rgba(232,75,15,0.15)'  },
  verification:       { icon: ShieldCheck,  color: '#2D9B8A', bg: 'rgba(45,155,138,0.15)' },
};


export default function NotificationPanel({ onClose }) {
  const { notifications, markOneRead, markNotificationsRead, clearAllNotifications } = useApp();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    // small delay to avoid same-click close
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 50);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const handleNotifClick = (n) => {
    markOneRead(n.id);
    if (n.type === 'match' || n.type === 'like' || n.type === 'superlike') navigate('/matches');
    else if (n.type === 'message') navigate('/messages');
    else if (n.type === 'review') navigate('/profile');
    onClose();
  };

  const groups = groupByDate(notifications);
  const hasAny = notifications.length > 0;
  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="notif-panel-backdrop" onClick={onClose} />
      <div className="notif-panel animate-slideInRight" ref={panelRef} role="dialog" aria-label="Notifications">
        {/* Header */}
        <div className="notif-panel-header">
          <div className="notif-panel-title">
            <Bell size={18} />
            Notifications
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </div>
          <div className="notif-panel-actions">
            {hasAny && (
              <>
                <button className="notif-action-btn" onClick={markNotificationsRead} title="Mark all read">
                  <CheckCircle size={15} />
                  All read
                </button>
                <button className="notif-action-btn danger" onClick={clearAllNotifications} title="Clear all">
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button className="notif-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="notif-panel-body">
          {!hasAny ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔔</div>
              <p>No notifications yet</p>
              <span>We'll let you know when someone matches or messages you!</span>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label} className="notif-group">
                  <div className="notif-group-label">{label}</div>
                  {items.map(n => {
                    const config = NOTIF_ICONS[n.type] || NOTIF_ICONS.review;
                    const IconComp = config.icon;
                    return (
                      <div
                        key={n.id}
                        className={`notif-row ${!n.read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(n)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleNotifClick(n)}
                      >
                        <div className="notif-row-left">
                          {n.avatar ? (
                            <div className="notif-avatar-wrap">
                              <img src={n.avatar} alt="" className="notif-avatar" />
                              <div className="notif-type-icon" style={{ background: config.bg, color: config.color }}>
                                <IconComp size={10} />
                              </div>
                            </div>
                          ) : (
                            <div className="notif-icon-only" style={{ background: config.bg, color: config.color }}>
                              <IconComp size={18} />
                            </div>
                          )}
                        </div>
                        <div className="notif-row-content">
                          <p className="notif-row-msg">{n.message}</p>
                          <span className="notif-row-time">{timeAgo(n.timestamp)}</span>
                        </div>
                        {!n.read && <div className="notif-unread-dot" />}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
