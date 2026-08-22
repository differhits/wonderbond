import { Link } from 'react-router-dom';
import { MapPin, Star, Globe, Bookmark, BookmarkX, MessageCircle, Zap, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './SavedPage.css';

export default function SavedPage() {
  const { savedProfiles, toggleSaveProfile, users } = useApp();

  const savedUsers = users.filter(u => savedProfiles.includes(u._id) || savedProfiles.includes(u.id));

  return (
    <div className="saved-page page-container">
      <div className="page-header">
        <h1 className="page-title">Saved Profiles</h1>
        <p className="page-subtitle">Travelers you've saved for later</p>
      </div>

      {savedUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bookmark size={40} style={{ opacity: 0.3 }} /></div>
          <h3>No saved profiles</h3>
          <p>Save profiles while discovering to keep track of interesting travelers</p>
          <Link to="/discover" className="btn btn-primary">Discover Travelers</Link>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
            {savedUsers.length} saved traveler{savedUsers.length !== 1 ? 's' : ''}
          </p>
          <div className="saved-grid">
            {savedUsers.map(u => {
              const uid = String(u._id || u.id || 'usr');
              const compat = 65 + (((uid.charCodeAt(1) || 5) * 7) % 28);
              const avatar = u.photos?.[0] || u.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Traveler')}&background=ff6584&color=fff`;

              return (
                <div key={uid} className="saved-card card">
                  <div className="saved-photo-wrap">
                    <img src={avatar} alt={u.name} className="saved-photo" />
                    <div className="saved-compat">
                      <Zap size={11} /> {compat}%
                    </div>
                    {u.verified && (
                      <div className="saved-verified">
                        <CheckCircle size={12} />
                      </div>
                    )}
                  </div>

                  <div className="saved-info">
                    <div className="saved-header">
                      <div>
                        <h3 className="saved-name">{u.name}{u.age ? `, ${u.age}` : ''}</h3>
                        <div className="saved-location"><MapPin size={12} /> {u.city || 'Global'}</div>
                      </div>
                      <div className="saved-rating">
                        <Star size={13} fill="#ffd700" color="#ffd700" />
                        {u.rating || '5.0'}
                      </div>
                    </div>

                    <div className="saved-badges">
                      {u.travelStyle && <span className="badge badge-primary"><Globe size={11} /> {u.travelStyle}</span>}
                    </div>

                    {u.bio && <p className="saved-bio">{u.bio}</p>}

                    {u.interests && u.interests.length > 0 && (
                      <div className="saved-interests">
                        {u.interests.slice(0, 4).map(i => <span key={i} className="tag">{i}</span>)}
                      </div>
                    )}

                    <div className="saved-actions">
                      <Link to="/messages" state={{ targetUserId: uid }} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        <MessageCircle size={14} /> Connect
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleSaveProfile(uid)}
                        data-tooltip="Remove from saved"
                      >
                        <BookmarkX size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
