import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, Star, Zap, Heart, Search, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './MatchesPage.css';

export default function MatchesPage() {
  const { matches, users } = useApp();
  const [search, setSearch] = useState('');

  const enriched = matches.map(m => ({
    ...m,
    user: users.find(u => u._id === m.userId || u.id === m.userId),
  })).filter(m => m.user);

  const filtered = enriched.filter(m =>
    m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="matches-page page-container">
      <div className="page-header">
        <h1 className="page-title">Your Matches</h1>
        <p className="page-subtitle">People who want to travel with you</p>
      </div>

      {/* Search */}
      <div className="matches-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search matches by name or city..."
          className="form-input"
          style={{ paddingLeft: 38 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💘</div>
          <h3>No matches yet</h3>
          <p>Start discovering travelers and swipe right to connect</p>
          <Link to="/discover" className="btn btn-primary">Go Discover</Link>
        </div>
      ) : (
        <div className="matches-grid">
          {filtered.map(match => {
            const u = match.user;
            const avatar = u.photos?.[0] || u.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Traveler')}&background=ff6584&color=fff`;
            const userId = u._id || u.id;

            return (
              <div key={match.id || userId} className="match-card card">
                {/* Top: photo + compat */}
                <div className="match-card-photo-wrap">
                  <img src={avatar} alt={u.name} className="match-card-photo" />
                  <div className="match-card-compat">
                    <Zap size={12} />
                    {match.compatibility || 90}%
                  </div>
                  {u.verified && (
                    <div className="match-card-verified">
                      <CheckCircle size={12} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="match-card-info">
                  <div className="match-card-header">
                    <h3 className="match-card-name">{u.name}{u.age ? `, ${u.age}` : ''}</h3>
                    <div className="match-card-rating">
                      <Star size={13} fill="#ffd700" color="#ffd700" />
                      {u.rating || '5.0'}
                    </div>
                  </div>
                  <div className="match-card-location">
                    <MapPin size={12} /> {u.city || 'Global'}{u.nationality ? `, ${u.nationality}` : ''}
                  </div>

                  <div className="match-card-tags">
                    {u.travelStyle && <span className="badge badge-primary">{u.travelStyle}</span>}
                    {u.budget && <span className="badge badge-warning">{u.budget}</span>}
                  </div>

                  {u.interests && u.interests.length > 0 && (
                    <div className="match-card-interests">
                      {u.interests.slice(0, 3).map(i => (
                        <span key={i} className="tag">{i}</span>
                      ))}
                    </div>
                  )}

                  {match.lastMessage && (
                    <div className="match-card-last-msg">
                      <MessageCircle size={12} />
                      {match.lastMessage}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="match-card-actions">
                    <Link to="/messages" state={{ targetUserId: userId }} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      <MessageCircle size={14} /> Message
                    </Link>
                    <Link to={`/profile/${userId}`} className="btn btn-secondary btn-sm">
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats bar */}
      <div className="matches-stats">
        <div className="matches-stat">
          <Heart size={16} style={{ color: 'var(--brand-secondary)' }} />
          <span>{matches.length} total matches</span>
        </div>
        <div className="matches-stat">
          <MessageCircle size={16} style={{ color: 'var(--brand-primary)' }} />
          <span>{matches.filter(m => m.lastMessage).length} active chats</span>
        </div>
      </div>
    </div>
  );
}
