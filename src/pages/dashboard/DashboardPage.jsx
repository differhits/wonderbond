import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Compass, Globe, Star, MapPin, ArrowRight,
  Zap, TrendingUp, Sparkles, Plane, X, Calendar, DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { mockTrips } from '../../data/trips';
import { getCommunityTripsAPI } from '../../services/tripService';
import './DashboardPage.css';

// ── Trip Details Modal on Dashboard ──────────────────────────────
function TripPreviewModal({ trip, onClose }) {
  const navigate = useNavigate();
  if (!trip) return null;

  const cityName = trip.destination.split(',')[0].trim();

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content trip-preview-modal" style={{ maxWidth: 520 }}>
        <div className="trip-preview-header">
          <div className="trip-preview-badge-row">
            <span className="badge badge-primary">{trip.purpose || 'Adventure'}</span>
            <span className="badge badge-warning"><DollarSign size={11} /> {trip.budget || 'Mid-range'}</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="trip-preview-body">
          <div className="trip-preview-title-wrap">
            <div className="trip-preview-icon"><Globe size={24} /></div>
            <div>
              <h2 className="trip-preview-dest">{trip.destination}</h2>
              {trip.departureCity && (
                <div className="trip-preview-from"><MapPin size={12} /> From {trip.departureCity}</div>
              )}
            </div>
          </div>

          <div className="trip-preview-meta-row">
            <div className="trip-preview-meta-item">
              <Calendar size={14} />
              <span>{trip.startDate} {trip.endDate ? `→ ${trip.endDate}` : ''}</span>
            </div>
            {trip.duration > 0 && (
              <div className="trip-preview-meta-item">
                <span>🗓️ {trip.duration} days trip</span>
              </div>
            )}
          </div>

          {trip.description && (
            <p className="trip-preview-desc">"{trip.description}"</p>
          )}

          {trip.activities && trip.activities.length > 0 && (
            <div className="trip-preview-activities">
              <div className="trip-preview-label">Suggested Activities:</div>
              <div className="tag-list">
                {trip.activities.map(a => (
                  <span key={a} className="tag">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div className="trip-preview-actions">
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                onClose();
                navigate('/trips', {
                  state: {
                    create: true,
                    tab: 'mine',
                    prefill: {
                      destination: trip.destination,
                      departureCity: trip.departureCity || '',
                      budget: trip.budget || 'Mid-range',
                      purpose: trip.purpose || '',
                      activities: trip.activities || [],
                      description: trip.description || `Trip to ${trip.destination}`,
                    }
                  }
                });
              }}
            >
              <Plane size={16} /> Plan a Trip to {cityName}
            </button>

            <div className="trip-preview-btn-row">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => {
                  onClose();
                  navigate('/discover');
                }}
              >
                <Compass size={15} /> Find Travelers
              </button>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => {
                  onClose();
                  navigate('/map');
                }}
              >
                <MapPin size={15} /> View on Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { matches, notifications, myTrips, users } = useApp();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [communityTrips, setCommunityTrips] = useState([]);

  // Fetch real trips from API if available
  useEffect(() => {
    getCommunityTripsAPI()
      .then(data => {
        if (data && data.length > 0) setCommunityTrips(data);
      })
      .catch(() => {});
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const recentMatches = matches.slice(0, 3);

  // Merge live community trips with mock trips
  const suggestedTrips = useMemo(() => {
    const combined = [...communityTrips, ...mockTrips];
    // deduplicate by destination
    const seen = new Set();
    const result = [];
    for (const t of combined) {
      const dest = t.destination || '';
      if (!seen.has(dest)) {
        seen.add(dest);
        result.push(t);
      }
      if (result.length >= 4) break;
    }
    return result;
  }, [communityTrips]);

  const nearbyUsers = users.slice(0, 4);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  // Stable compat scores — computed once, not on every render
  const compatScores = useMemo(() => {
    const scores = {};
    nearbyUsers.forEach(u => {
      scores[u._id || u.id] = Math.floor(Math.random() * 25) + 70;
    });
    return scores;
  }, [nearbyUsers.length]);

  return (
    <div className="dashboard page-container">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-greeting">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="dashboard-sub">
            {matches.length > 0
              ? `You have ${matches.length} matches waiting to connect with you!`
              : 'Start discovering travel partners for your next adventure.'}
          </p>
        </div>
        <Link to="/discover" className="btn btn-primary">
          <Compass size={18} /> Discover Travelers
        </Link>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {[
          { icon: Heart, label: 'Matches', value: matches.length, color: '#ff6584', to: '/matches' },
          { icon: MessageCircle, label: 'Messages', value: matches.reduce((s, m) => s + (m.unread || 0), 0), color: '#6c63ff', to: '/messages' },
          { icon: Globe, label: 'My Trips', value: myTrips.length, color: '#43e97b', to: '/trips' },
          { icon: Star, label: 'Reviews', value: user?.reviews?.length || user?.reviewCount || 0, color: '#ffbe0b', to: '/profile' },
        ].map(s => (
          <Link key={s.label} to={s.to} className="stat-card card">
            <div className="stat-card-icon" style={{ background: `${s.color}18`, color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Matches */}
        <section className="dashboard-section">
          <div className="section-row">
            <h3>Recent Matches</h3>
            <Link to="/matches" className="section-link">View all <ArrowRight size={14} /></Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 0, opacity: 0.5 }}>
                <Sparkles size={40} strokeWidth={1.2} color="var(--brand-primary)" />
              </div>
              <h3>No matches yet</h3>
              <p>Start swiping to find your travel partner</p>
              <Link to="/discover" className="btn btn-primary btn-sm">Discover</Link>
            </div>
          ) : (
            <div className="match-list">
              {recentMatches.map(match => {
                const u = users.find(x => x._id === match.userId || x.id === match.userId);
                if (!u) return null;
                const avatar = u.photos?.[0] || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=E84B0F&color=fff`;
                return (
                  <Link to={`/messages`} key={match.id} className="match-item">
                    <div className="match-avatar-wrap">
                      <img src={avatar} alt={u.name} className="avatar avatar-md" />
                      <span className="match-online-dot" />
                    </div>
                    <div className="match-info">
                      <div className="match-name">{u.name}</div>
                      <div className="match-meta">
                        <MapPin size={11} /> {u.city}
                      </div>
                      {match.lastMessage && (
                        <div className="match-last-msg">{match.lastMessage}</div>
                      )}
                    </div>
                    <div className="match-compat-badge">
                      <Zap size={12} />
                      {match.compatibility}%
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Trending Destinations */}
        <section className="dashboard-section">
          <div className="section-row">
            <h3>Trending Trips</h3>
            <Link to="/trips" state={{ tab: 'community' }} className="section-link">
              Explore <ArrowRight size={14} />
            </Link>
          </div>
          <div className="trip-list">
            {suggestedTrips.map(trip => (
              <div
                key={trip._id || trip.id}
                className="trip-item clickable"
                onClick={() => setSelectedTrip(trip)}
                role="button"
                tabIndex={0}
                title={`Click to view details for ${trip.destination}`}
              >
                <div className="trip-item-icon">
                  <Globe size={18} />
                </div>
                <div className="trip-item-info">
                  <div className="trip-item-dest">{trip.destination}</div>
                  <div className="trip-item-meta">{trip.startDate} · {trip.duration || 10} days · {trip.budget || 'Mid-range'}</div>
                </div>
                <span className="badge badge-primary">{trip.purpose || 'Adventure'}</span>
                <div className="trip-item-arrow">→</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Suggested Travelers */}
      <section className="dashboard-section" style={{ marginTop: 32 }}>
        <div className="section-row">
          <h3>Travelers You Might Like</h3>
          <Link to="/discover" className="section-link">See all <ArrowRight size={14} /></Link>
        </div>
        <div className="suggested-grid">
          {nearbyUsers.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <p>No travelers yet. <Link to="/auth?mode=register" style={{ color: 'var(--brand-primary)' }}>Invite friends</Link> to join!</p>
            </div>
          ) : nearbyUsers.map(u => {
            const avatar = u.photos?.[0] || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=E84B0F&color=fff`;
            return (
              <Link to="/discover" key={u._id || u.id} className="suggested-card card">
                <div className="suggested-photo-wrap">
                  <img src={avatar} alt={u.name} className="suggested-photo" />
                  <div className="suggested-compat">
                    <TrendingUp size={12} />
                    {compatScores[u._id || u.id] || 80}%
                  </div>
                </div>
                <div className="suggested-info">
                  <div className="suggested-name">{u.name}{u.age ? `, ${u.age}` : ''}</div>
                  <div className="suggested-city"><MapPin size={11} /> {u.city || 'Somewhere'}</div>
                  <div className="suggested-tags">
                    {(u.interests || []).slice(0, 2).map(i => (
                      <span key={i} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Notifications */}
      {unreadNotifs > 0 && (
        <section className="dashboard-section" style={{ marginTop: 32 }}>
          <div className="section-row">
            <h3>Recent Activity</h3>
            <Link to="/settings?tab=notifications" className="section-link">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="notif-list">
            {notifications.filter(n => !n.read).slice(0, 3).map(n => (
              <div key={n.id} className="notif-item">
                {n.avatar
                  ? <img src={n.avatar} alt="" className="avatar avatar-sm" />
                  : <div className="notif-icon-placeholder"><Zap size={16} /></div>
                }
                <div className="notif-content">
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{new Date(n.timestamp).toLocaleDateString()}</div>
                </div>
                <div className="notif-dot" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trip Details Modal */}
      {selectedTrip && (
        <TripPreviewModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
}
