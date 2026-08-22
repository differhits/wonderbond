import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  X, Heart, Star, MapPin, DollarSign, Filter,
  ChevronDown, CheckCircle, Navigation, Loader, AlertCircle, RefreshCw,
  Sun, Waves, Map
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { useLocation as useLocationHook } from '../../hooks/useLocation';

import './DiscoverPage.css';

const COMPAT_FACTORS = [
  { label: 'Destination Match', weight: 30, color: '#2D9B8A' },
  { label: 'Travel Date Overlap', weight: 25, color: '#E84B0F' },
  { label: 'Budget Preference', weight: 15, color: '#22C55E' },
  { label: 'Travel Style', weight: 10, color: '#F59E0B' },
  { label: 'Shared Interests', weight: 10, color: '#3B82F6' },
  { label: 'Language Match', weight: 5, color: '#8B5CF6' },
  { label: 'Age Preference', weight: 5, color: '#EC4899' },
];

function CompatScore({ score }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 65 ? '#2D9B8A' : '#F59E0B';
  return (
    <div className="compat-display">
      <div className="compat-ring-wrap">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
          <circle cx="40" cy="40" r={radius} fill="none"
            stroke={color} strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="compat-center">
          <span className="compat-pct" style={{ color }}>{score}%</span>
          <span className="compat-label">Match</span>
        </div>
      </div>
      <div className="compat-factors">
        {COMPAT_FACTORS.map((f) => {
          const val = Math.min(f.weight, Math.floor((score / 100) * f.weight * (0.7 + Math.random() * 0.6)));
          return (
            <div key={f.label} className="compat-factor">
              <div className="compat-factor-header">
                <span className="compat-factor-label">{f.label}</span>
                <span className="compat-factor-val" style={{ color: f.color }}>{val}/{f.weight}</span>
              </div>
              <div className="progress-bar" style={{ height: '4px' }}>
                <div className="progress-fill" style={{ width: `${(val / f.weight) * 100}%`, background: f.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Swipeable Card ──────────────────────────────────────────────
const SWIPE_THRESHOLD = 100;


const SwipeCard = forwardRef(function SwipeCard({ user, onLike, onSkip, onSuperLike, isTop, zIndex }, ref) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const compat = (() => {
    const uid = user._id || user.id || '';
    const seed = typeof uid === 'string' ? (uid.charCodeAt(3) || 5) : 5;
    return 65 + ((seed * 7) % 28);
  })();


  const cardRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const [dragStyle, setDragStyle] = useState({});
  const [stampDir, setStampDir] = useState(null);

  // Expose programmatic swipe to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSwipe(dir) {
      if (dir === 'like') {
        setStampDir('like');
        setDragStyle({ transform: 'translate(150vw, -20px) rotate(30deg)', transition: 'transform 0.42s ease' });
        setTimeout(onLike, 400);
      } else if (dir === 'skip') {
        setStampDir('nope');
        setDragStyle({ transform: 'translate(-150vw, -20px) rotate(-30deg)', transition: 'transform 0.42s ease' });
        setTimeout(onSkip, 400);
      } else if (dir === 'super') {
        setStampDir('super');
        setDragStyle({ transform: 'translate(0, -150vh)', transition: 'transform 0.42s ease' });
        setTimeout(onSuperLike, 400);
      }
    }
  }), [onLike, onSkip, onSuperLike]);

  const applyDrag = useCallback((dx, dy) => {
    const rotate = dx * 0.06;
    setDragStyle({ transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, transition: 'none' });
    if (dx > 40) setStampDir('like');
    else if (dx < -40) setStampDir('nope');
    else if (dy < -40) setStampDir('super');
    else setStampDir(null);
  }, []);

  const releaseDrag = useCallback((dx, dy) => {
    if (dx > SWIPE_THRESHOLD) {
      setDragStyle({ transform: 'translate(150vw, -20px) rotate(30deg)', transition: 'transform 0.4s ease' });
      setTimeout(onLike, 380);
    } else if (dx < -SWIPE_THRESHOLD) {
      setDragStyle({ transform: 'translate(-150vw, -20px) rotate(-30deg)', transition: 'transform 0.4s ease' });
      setTimeout(onSkip, 380);
    } else if (dy < -SWIPE_THRESHOLD * 0.8) {
      setDragStyle({ transform: 'translate(0, -150vh)', transition: 'transform 0.4s ease' });
      setTimeout(onSuperLike, 380);
    } else {
      setDragStyle({ transform: 'translate(0,0) rotate(0deg)', transition: 'transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275)' });
      setStampDir(null);
    }
  }, [onLike, onSkip, onSuperLike]);

  const onPointerDown = useCallback((e) => {
    if (!isTop) return;
    if (e.target.closest('button') || e.target.closest('.swipe-expand-btn')) return;
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
    cardRef.current?.setPointerCapture(e.pointerId);
  }, [isTop]);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    dragState.current.dx = dx;
    dragState.current.dy = dy;
    applyDrag(dx, dy);
  }, [applyDrag]);

  const onPointerUp = useCallback(() => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    releaseDrag(dragState.current.dx, dragState.current.dy);
  }, [releaseDrag]);


  if (!isTop) {
    const backPhoto = user.photos?.[0] || user.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=2D9B8A&color=fff&size=400`;
    return (
      <div className="swipe-card swipe-card-back" style={{ zIndex }}>
        <div className="swipe-card-photos" style={{ flex: '0 0 62%' }}>
          <img
            src={backPhoto}
            alt=""
            className="swipe-card-photo"
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=2D9B8A&color=fff&size=400`; }}
          />
        </div>
        <div className="swipe-card-info" />
      </div>
    );
  }

  const displayTags = user.interests?.slice(0, 3) || [];
  const extraCount = (user.interests?.length || 0) - 3;

  return (
    <div
      ref={cardRef}
      className="swipe-card swipe-card-top"
      style={{ ...dragStyle, zIndex }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Stamps */}
      <div className={`swipe-stamp swipe-stamp-like ${stampDir === 'like' ? 'visible' : ''}`}>LIKE ❤️</div>
      <div className={`swipe-stamp swipe-stamp-nope ${stampDir === 'nope' ? 'visible' : ''}`}>NOPE ✕</div>
      <div className={`swipe-stamp swipe-stamp-super ${stampDir === 'super' ? 'visible' : ''}`}>SUPER ⭐</div>

      {/* Photo section */}
      <div className="swipe-card-photos">
        <img
          src={user.photos?.[photoIdx] || user.photos?.[0] || user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=E84B0F&color=fff&size=600`
          }
          alt={user.name}
          className="swipe-card-photo"
          draggable={false}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=E84B0F&color=fff&size=600`; }}
        />

        {/* Photo dots — only if multiple photos */}
        {(user.photos?.length || 0) > 1 && (
          <div className="photo-dots">
            {user.photos.map((_, i) => (
              <button key={i} className={`photo-dot ${i === photoIdx ? 'active' : ''}`} onClick={() => setPhotoIdx(i)} />
            ))}
          </div>
        )}

        {/* Tap zones */}
        <div className="photo-nav-left" onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
        <div className="photo-nav-right" onClick={() => setPhotoIdx(i => Math.min((user.photos?.length || 1) - 1, i + 1))} />

        {/* Location badge (top-left) */}
        <div className="swipe-location-badge">
          <MapPin size={12} color="#E84B0F" />
          {user.city}, {user.nationality}
        </div>

        {/* Compat ring (top-right) */}
        <div className="swipe-compat-ring">
          <svg viewBox="0 0 52 52" style={{ position: 'absolute', inset: 0, width: 52, height: 52 }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
            <circle cx="26" cy="26" r="22" fill="none"
              stroke="#2D9B8A" strokeWidth="5"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * (1 - compat / 100)}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="swipe-compat-pct">{compat}%</span>
        </div>

        {/* Verified */}
        {user.verified && (
          <div className="swipe-verified">
            <CheckCircle size={11} fill="white" /> Verified
          </div>
        )}

        {/* Gradient + name overlay */}
        <div className="swipe-card-gradient" />
        <div className="swipe-card-overlay-info">
          <h3 className="swipe-card-name">{user.name}, <span>{user.age}</span></h3>
          <div className="swipe-card-tagline">
            <Waves size={12} />
            Looking for a travel companion
          </div>
        </div>
      </div>

      {/* Info section (white bottom) */}
      <div className="swipe-card-info">
        {/* Quote */}
        <p className="swipe-card-quote">"{user.bio}"</p>

        {/* Interest tags */}
        <div className="swipe-card-interests">
          {displayTags.map(tag => (
            <span key={tag} className="interest-tag">{tag}</span>
          ))}
          {extraCount > 0 && (
            <span className="interest-tag-more">+{extraCount}</span>
          )}
        </div>

        {/* Vibe + Budget row */}
        <div className="swipe-info-row">
          <div className="swipe-info-chip">
            <Sun size={16} className="swipe-info-chip-icon" />
            <div className="swipe-info-chip-text">
              <span className="swipe-info-chip-label">VIBE</span>
              <span className="swipe-info-chip-value">{user.travelStyle || 'Explorer'}</span>
            </div>
          </div>
          <div className="swipe-info-chip">
            <DollarSign size={16} className="swipe-info-chip-icon" />
            <div className="swipe-info-chip-text">
              <span className="swipe-info-chip-label">BUDGET</span>
              <span className="swipe-info-chip-value">{user.budget || 'Mid-Range'}</span>
            </div>
          </div>
        </div>

        {/* Expand */}
        <button className="swipe-expand-btn" onClick={() => setShowDetails(d => !d)}>
          {showDetails ? 'Less info' : 'Compatibility & more'}
          <ChevronDown size={14} style={{ transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showDetails && (
          <div className="swipe-details animate-fadeIn">
            <CompatScore score={compat} />
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Location Bar ────────────────────────────────────────────────
function LocationBar({ location, onRequest }) {
  return (
    <div className="location-bar">
      <div className="location-bar-left">
        <div className={`location-icon ${location.granted ? 'granted' : ''}`}>
          {location.loading ? <Loader size={14} className="spin-anim" /> : <Navigation size={14} />}
        </div>
        <div className="location-text">
          {location.loading && <span className="location-detecting">Detecting location…</span>}
          {!location.loading && location.granted && (
            <span className="location-city">
              📍 {location.city}{location.country ? `, ${location.country}` : ''}
              <span className="location-showing"> · Showing travelers near you</span>
            </span>
          )}
          {!location.loading && !location.granted && !location.error && (
            <span className="location-prompt">Share location to find nearby travelers</span>
          )}
          {!location.loading && location.error && (
            <span className="location-error"><AlertCircle size={12} /> {location.error}</span>
          )}
        </div>
      </div>
      <div className="location-bar-right">
        {!location.granted && !location.loading && (
          <button className="location-allow-btn" onClick={onRequest}>
            <Navigation size={13} /> Allow
          </button>
        )}
        {location.granted && (
          <button className="location-refresh-btn" onClick={onRequest} title="Refresh location">
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function DiscoverPage() {
  const { addMatch, addNotification, saveUserLocation, users, usersLoading } = useApp();

  const cardRef = useRef(null);
  const gpsLocation = useLocationHook();
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState(0);
  const [showMatch, setShowMatch] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    gender: 'Any',
    minAge: 18,
    maxAge: 60,
    budget: searchParams.get('budget') || 'Any',
    travelStyle: 'Any',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  // When URL params change (new search from topbar), update filters
  useEffect(() => {
    const dest = searchParams.get('destination') || '';
    const budget = searchParams.get('budget') || 'Any';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    setFilters(f => ({ ...f, destination: dest, budget, startDate, endDate }));
    setCurrent(0);
  }, [searchParams]);

  // Reset queue when users load
  useEffect(() => { setCurrent(0); }, [users.length]);

  // Apply filters to user queue
  const queue = users.filter(u => {
    if (filters.destination) {
      const dest = filters.destination.toLowerCase();
      const inCity = u.city?.toLowerCase().includes(dest);
      const inNationality = u.nationality?.toLowerCase().includes(dest);
      if (!inCity && !inNationality) return false;
    }
    if (filters.gender !== 'Any' && u.gender !== filters.gender) return false;
    if (filters.budget !== 'Any' && u.budget && u.budget !== filters.budget) return false;
    if (filters.travelStyle !== 'Any' && u.travelStyle && u.travelStyle !== filters.travelStyle) return false;
    if (u.age) {
      if (u.age < filters.minAge || u.age > filters.maxAge) return false;
    }
    return true;
  });

  useEffect(() => {
    if (gpsLocation.granted && gpsLocation.city) {
      saveUserLocation({ city: gpsLocation.city, country: gpsLocation.country, lat: gpsLocation.lat, lng: gpsLocation.lng });
    }
  }, [gpsLocation.granted, gpsLocation.city]);

  const currentUser = queue[current];
  const nextUser = queue[current + 1];

  const handleLike = useCallback(() => {
    if (!currentUser) return;
    // Like notification to THEM (simulated locally for demo)
    addNotification({
      type: 'like',
      message: `You liked ${currentUser.name}'s profile ⭐`,
      avatar: currentUser.photos?.[0] || currentUser.avatar || null,
      userId: currentUser._id || currentUser.id,
    });
    addMatch(currentUser._id || currentUser.id);
    setShowMatch(currentUser);
    setTimeout(() => { setShowMatch(null); setCurrent(c => c + 1); }, 2200);
  }, [currentUser, addMatch, addNotification]);

  const handleSkip = useCallback(() => {
    if (!currentUser) return;
    setCurrent(c => c + 1);
  }, [currentUser]);

  const handleSuperLike = useCallback(() => {
    if (!currentUser) return;
    addNotification({
      type: 'superlike',
      message: `You Super Liked ${currentUser.name}! 💜`,
      avatar: currentUser.photos?.[0] || currentUser.avatar || null,
      userId: currentUser._id || currentUser.id,
    });
    addMatch(currentUser._id || currentUser.id);
    setShowMatch(currentUser);
    setTimeout(() => { setShowMatch(null); setCurrent(c => c + 1); }, 2200);
  }, [currentUser, addMatch, addNotification]);


  const isDone = current >= queue.length;

  return (
    <div className="discover-page">
      {/* Location Bar */}
      <LocationBar location={gpsLocation} onRequest={gpsLocation.requestLocation} />

      {/* Header */}
      <div className="discover-header">
        <div>
          <h1 className="page-title">Discover</h1>
          <p className="page-subtitle">
            {gpsLocation.granted && gpsLocation.city
              ? `Travelers near ${gpsLocation.city}`
              : 'Find your perfect travel companion'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/map" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            <Map size={14} /> Travel Map
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>


      {/* Filters */}
      {showFilters && (
        <div className="filter-panel card animate-fadeIn">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input type="text" className="form-input" placeholder="e.g. Bali, Tokyo"
                value={filters.destination} onChange={e => setFilters(f => ({ ...f, destination: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
                {['Any', 'Male', 'Female', 'Non-binary'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <select className="form-select" value={filters.budget} onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}>
                {['Any', 'Budget', 'Mid-range', 'Luxury'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Travel Style</label>
              <select className="form-select" value={filters.travelStyle} onChange={e => setFilters(f => ({ ...f, travelStyle: e.target.value }))}>
                {['Any', 'Backpacker', 'Cultural', 'Adventure', 'Luxury', 'Digital Nomad'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ destination: '', gender: 'Any', minAge: 18, maxAge: 60, budget: 'Any', travelStyle: 'Any' })}>Reset</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFilters(false)}>Apply</button>
          </div>
        </div>
      )}

      {/* Swipe area */}
      <div className="swipe-area">
        {usersLoading ? (
          <div className="no-more-cards">
            <div className="no-more-icon"><Loader size={40} className="spin-anim" /></div>
            <h3>Finding travelers...</h3>
            <p>Loading travel companions near you</p>
          </div>
        ) : isDone ? (
          <div className="no-more-cards">
            <div className="no-more-icon">🌍</div>
            <h3>You've seen everyone!</h3>
            <p>Check back later or adjust your filters.</p>
            <button className="btn btn-primary" onClick={() => setCurrent(0)}>Start Over</button>
          </div>
        ) : (
          <>
            <div className="card-stack">
              {nextUser && (
                <SwipeCard
                  key={(nextUser._id || nextUser.id) + '-back'}
                  user={nextUser}
                  isTop={false}
                  zIndex={1}
                  onLike={() => {}} onSkip={() => {}} onSuperLike={() => {}}
                />
              )}
              {currentUser && (
                <SwipeCard
                  key={currentUser._id || currentUser.id}
                  ref={cardRef}
                  user={currentUser}
                  isTop={true}
                  zIndex={2}
                  onLike={handleLike}
                  onSkip={handleSkip}
                  onSuperLike={handleSuperLike}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="swipe-actions">
              <button className="swipe-btn swipe-skip" onClick={() => cardRef.current?.triggerSwipe('skip')} aria-label="Skip">
                <X size={22} />
              </button>
              <button className="swipe-btn swipe-superlike" onClick={() => cardRef.current?.triggerSwipe('super')} aria-label="Super Like">
                <Star size={19} />
              </button>
              <button className="swipe-btn swipe-like" onClick={() => cardRef.current?.triggerSwipe('like')} aria-label="Like">
                <Heart size={24} />
              </button>
            </div>

            <div className="swipe-hint">
              <span><X size={11} /> Swipe Left to Pass</span>
              <span>·</span>
              <span><Heart size={11} /> Swipe Right to Like</span>
            </div>
          </>
        )}
      </div>

      {/* Match overlay */}
      {showMatch && (
        <div className="match-overlay">
          <div className="match-overlay-bg" />
          <div className="match-overlay-content animate-scaleIn">
            <div className="match-sparkles">🎉</div>
            <h2 className="match-title">It's a Match!</h2>
            <p className="match-sub">You and <strong>{showMatch.name}</strong> are both interested!</p>
            <div className="match-avatars">
              <div className="match-avatar-ring">
                <img
                  src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=88&h=88&fit=crop"
                  className="avatar avatar-xl"
                  alt="You"
                />
              </div>
              <div className="match-heart">💛</div>
              <div className="match-avatar-ring">
                <img
                  src={showMatch.photos?.[0] || showMatch.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(showMatch.name)}&background=E84B0F&color=fff`
                  }
                  className="avatar avatar-xl"
                  alt={showMatch.name}
                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(showMatch.name)}&background=E84B0F&color=fff`; }}
                />
              </div>
            </div>
            <button className="btn btn-primary match-msg-btn" onClick={() => setShowMatch(null)}>
              Continue Discovering
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
