import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Star, CheckCircle, Edit2, Camera, MessageCircle, UserPlus,
  Flag, Shield, Calendar, Mail, Phone, Globe, User as UserIcon,
  Plane, Sparkles, Clock, BadgeCheck, Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { mockReviews } from '../../data/reviews';
import { getMyTripsAPI, getCommunityTripsAPI } from '../../services/tripService';
import './ProfilePage.css';

/* ── Star Rating ─────────────────────────────────────────── */
function StarRating({ value }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          fill={i <= Math.round(value) ? '#FBBF24' : 'none'}
          color={i <= Math.round(value) ? '#FBBF24' : 'var(--text-muted)'}
        />
      ))}
    </div>
  );
}

/* ── Review Card ─────────────────────────────────────────── */
function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar-placeholder">
          <UserIcon size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="review-author">Anonymous Traveler</div>
          <div className="review-dest">Traveled to: {review.tripDestination}</div>
        </div>
        <StarRating value={review.ratings.overall} />
      </div>
      <p className="review-text">"{review.feedback}"</p>
      <div className="review-ratings">
        {Object.entries(review.ratings).filter(([k]) => k !== 'overall').map(([key, val]) => (
          <div key={key} className="review-rating-item">
            <span className="review-rating-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${val * 20}%` }} />
            </div>
            <span className="review-rating-val">{val}/5</span>
          </div>
        ))}
      </div>
      {review.wouldTravelAgain && (
        <div className="review-would-travel">
          <CheckCircle size={12} /> Would travel again
        </div>
      )}
    </div>
  );
}

/* ── Trip image fallbacks ─────────────────────────────────── */
const TRIP_IMAGES = [
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop',
];

/* ── Info Row ─────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, verified, action }) {
  return (
    <div className="profile-info-row">
      <div className="profile-info-icon">
        <Icon size={14} />
      </div>
      <div className="profile-info-content">
        <span className="profile-info-label">{label}</span>
        <span className="profile-info-value">
          {value || <span className="profile-info-empty">Not set</span>}
          {verified && <BadgeCheck size={13} className="profile-verified-small" />}
        </span>
      </div>
      {action && (
        <button className="profile-verify-btn" onClick={action.fn}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const { users } = useApp();
  const [tab, setTab] = useState('reviews');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [userTrips, setUserTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const isOwnProfile = !userId || userId === 'me';
  const profileUser = isOwnProfile
    ? currentUser
    : users.find(u => u._id === userId || u.id === userId);

  // Fetch real trips for this profile
  useEffect(() => {
    if (!profileUser) return;
    const fetchTrips = async () => {
      setTripsLoading(true);
      try {
        if (isOwnProfile) {
          const trips = await getMyTripsAPI();
          setUserTrips(trips);
        } else {
          const allTrips = await getCommunityTripsAPI();
          const pId = profileUser._id || profileUser.id;
          const filtered = allTrips.filter(t => (t.userId?._id || t.userId?.id || t.userId) === pId);
          setUserTrips(filtered);
        }
      } catch (err) {
        console.error('Error fetching profile trips:', err);
        setUserTrips([]);
      } finally {
        setTripsLoading(false);
      }
    };
    fetchTrips();
  }, [profileUser, isOwnProfile]);

  /* ── Location via browser ──────────────────────────────── */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationText('Geolocation not supported');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state ||
            'Unknown';
          const country = data.address?.country || '';
          setLocationText(`${city}, ${country}`);
        } catch {
          setLocationText(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationText('Permission denied');
        setLocationLoading(false);
      }
    );
  }, []);

  if (!profileUser) {
    return (
      <div className="profile-not-found">
        <UserIcon size={48} strokeWidth={1.2} />
        <h3>User not found</h3>
        <Link to="/discover" className="btn btn-primary">Back to Discover</Link>
      </div>
    );
  }

  const userReviews = Array.isArray(profileUser.reviews)
    ? profileUser.reviews
    : (profileUser.id && String(profileUser.id).startsWith('u_')
        ? mockReviews.filter(r => r.revieweeId === profileUser.id)
        : []);
  const avgRating = userReviews.length > 0
    ? (userReviews.reduce((s, r) => s + (r.ratings?.overall || r.rating || 5), 0) / userReviews.length).toFixed(1)
    : (profileUser.rating ? Number(profileUser.rating).toFixed(1) : '0.0');

  const memberSince = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently joined';

  const handleEditSave = async () => {
    setSaving(true);
    await updateProfile(editData);
    setSaving(false);
    setEditing(false);
  };

  const displayLocation = locationText ||
    (profileUser.city && profileUser.nationality
      ? `${profileUser.city}, ${profileUser.nationality}`
      : profileUser.city || profileUser.nationality || null);

  return (
    <div className="profile-page">
      <div className="profile-page-layout">

        {/* ── Left Panel ──────────────────────────────────── */}
        <div className="profile-left-panel">

          {/* Avatar section */}
          <div className="profile-avatar-section">
            {profileUser.photos?.[0] || profileUser.avatar ? (
              <img
                src={profileUser.photos?.[0] || profileUser.avatar}
                alt={profileUser.name}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <UserIcon size={40} strokeWidth={1.2} />
              </div>
            )}
            {isOwnProfile && (
              <button
                className="profile-camera-btn"
                title="Change photo"
                onClick={() => { setEditing(true); setEditData(profileUser); }}
              >
                <Camera size={15} />
              </button>
            )}
            {/* Compat score for other users */}
            {!isOwnProfile && (
              <div className="profile-compat-badge">92%</div>
            )}
          </div>

          {/* Name + Verified */}
          <div className="profile-left-body">
            <div className="profile-name-row">
              <span className="profile-main-name">{profileUser.name}</span>
              {profileUser.verified && (
                <BadgeCheck size={18} className="profile-verified-icon" />
              )}
            </div>

            {/* Travel style tags */}
            <div className="profile-tag-row">
              {profileUser.travelStyle && (
                <span className="profile-style-tag">{profileUser.travelStyle}</span>
              )}
              <span className="profile-style-tag secondary">
                {Math.max(userTrips.length, 0)}+ trips
              </span>
            </div>

            {/* Action buttons */}
            {isOwnProfile ? (
              <button
                className="profile-edit-btn"
                onClick={() => { setEditing(true); setEditData({ ...profileUser }); }}
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <div className="profile-action-row">
                <Link to="/messages" className="profile-msg-btn">
                  <MessageCircle size={15} /> Message
                </Link>
                <button className="profile-add-btn" aria-label="Add friend">
                  <UserPlus size={16} />
                </button>
              </div>
            )}

            {/* Identity & Contact */}
            <div className="profile-info-section">
              <div className="profile-section-title">Personal Info</div>
              <div className="profile-info-list">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={isOwnProfile ? profileUser.email : null}
                  verified={profileUser.verified}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={profileUser.phone || null}
                  action={isOwnProfile && !profileUser.phone
                    ? { label: 'Add', fn: () => { setEditing(true); setEditData({ ...profileUser }); } }
                    : null}
                />
                <InfoRow
                  icon={MapPin}
                  label="Location"
                  value={displayLocation}
                />
                <InfoRow
                  icon={Globe}
                  label="Nationality"
                  value={profileUser.nationality || null}
                />
                <InfoRow
                  icon={Clock}
                  label="Member since"
                  value={memberSince}
                />
              </div>

              {/* Live location button */}
              {isOwnProfile && (
                <button
                  className="profile-location-btn"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  <Navigation size={13} />
                  {locationLoading ? 'Detecting...' : 'Detect live location'}
                </button>
              )}
            </div>

            {/* Travel Stats */}
            <div className="profile-stats-section">
              <div className="profile-section-title">Travel Stats</div>
              <div className="profile-stats-list">
                <div className="profile-stat-row">
                  <span className="profile-stat-label">Countries</span>
                  <span className="profile-stat-value">{Math.max(userTrips.length, 14)}</span>
                </div>
                <div className="profile-stat-row">
                  <span className="profile-stat-label">Trips Planned</span>
                  <span className="profile-stat-value">{Math.max(userTrips.length, 6)}</span>
                </div>
                <div className="profile-stat-row">
                  <span className="profile-stat-label">Travel Style</span>
                  <span className="profile-stat-value" style={{ color: 'var(--brand-secondary)' }}>
                    {profileUser.travelStyle || 'Balanced'}
                  </span>
                </div>
                <div className="profile-stat-row">
                  <span className="profile-stat-label">Budget</span>
                  <span className="profile-stat-value" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {profileUser.budget || 'Mid-Range'}
                  </span>
                </div>
                {avgRating > 0 && (
                  <div className="profile-stat-row">
                    <span className="profile-stat-label">Rating</span>
                    <span className="profile-stat-value" style={{ color: '#FBBF24' }}>
                      {avgRating} / 5
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────── */}
        <div className="profile-right-panel">

          {/* About Me */}
          <div className="profile-about-card">
            <h2>About Me</h2>
            <p className="profile-about-bio">
              {profileUser.bio || (
                isOwnProfile
                  ? 'Add a bio to tell other travelers about yourself.'
                  : 'This traveler hasn\'t added a bio yet.'
              )}
            </p>
            {profileUser.interests?.length > 0 && (
              <>
                <div className="profile-interests-title">Interests</div>
                <div className="profile-interests-row">
                  {profileUser.interests.map(i => (
                    <span key={i} className="tag">{i}</span>
                  ))}
                </div>
              </>
            )}
            {profileUser.languages?.length > 0 && (
              <>
                <div className="profile-interests-title" style={{ marginTop: 16 }}>Languages</div>
                <div className="profile-interests-row">
                  {profileUser.languages.map(l => (
                    <span key={l} className="tag">{l}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upcoming Trips */}
          <div className="profile-trips-card">
            <h2>Upcoming Trips</h2>
            <div className="profile-trips-grid">
              {userTrips.map((trip, idx) => (
                <div key={trip._id || trip.id || idx} className="profile-trip-item">
                  <div className="profile-trip-photo">
                    <img src={TRIP_IMAGES[idx % TRIP_IMAGES.length]} alt={trip.destination} />
                    <div className="profile-trip-date-badge">
                      <Calendar size={11} />
                      {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'Upcoming'}
                    </div>
                  </div>
                  <div className="profile-trip-body">
                    <div className="profile-trip-dest">{trip.destination}</div>
                    <div className="profile-trip-country">
                      <MapPin size={11} /> {trip.departureCity ? `From ${trip.departureCity}` : 'Planned Trip'}
                    </div>
                    {trip.duration > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: 2, fontWeight: 600 }}>
                        {trip.duration} days · {trip.budget || 'Mid-range'}
                      </div>
                    )}
                    <div className="profile-trip-footer">
                      <span className="profile-trip-spots">{trip.purpose || 'Looking for companion'}</span>
                      <Link to="/trips" className="profile-trip-link">View Trips</Link>
                    </div>
                  </div>
                </div>
              ))}

              {userTrips.length === 0 && (
                <div className="profile-trip-empty-card">
                  <Plane size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: 8 }} />
                  <h4>No upcoming trips yet</h4>
                  <p>{isOwnProfile ? 'Create a trip to find companions who want to travel with you!' : 'This traveler has not posted any upcoming trips yet.'}</p>
                </div>
              )}

              {/* Add / Propose card */}
              {!isOwnProfile ? (
                <div className="profile-trip-propose">
                  <MapPin size={26} color="var(--brand-primary-light)" style={{ opacity: 0.6 }} />
                  <p>Planning something new?</p>
                  <span>Suggest a destination to {profileUser.name?.split(' ')[0] || 'them'}.</span>
                  <Link to="/trips" className="propose-trip-btn">Propose a Trip</Link>
                </div>
              ) : (
                <div className="profile-trip-propose">
                  <Plane size={26} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                  <p>Plan a new trip</p>
                  <Link to="/trips" className="propose-trip-btn">Add Trip</Link>
                </div>
              )}
            </div>
          </div>

          {/* Reviews / Trips Tabs */}
          <div className="profile-tabs-section">
            <div className="profile-tabs">
              {['reviews', 'trips'].map(t => (
                <button
                  key={t}
                  className={`profile-tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  <span className="profile-tab-count">
                    {t === 'reviews' ? userReviews.length : userTrips.length}
                  </span>
                </button>
              ))}
            </div>

            {tab === 'reviews' && (
              <div className="animate-fadeIn">
                {userReviews.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <div className="empty-state-svg">
                      <Star size={36} strokeWidth={1.2} color="var(--text-muted)" />
                    </div>
                    <h3>No reviews yet</h3>
                    <p>Reviews appear here after completing trips</p>
                  </div>
                ) : (
                  <div className="reviews-list">
                    {userReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'trips' && (
              <div className="animate-fadeIn">
                {userTrips.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <div className="empty-state-svg">
                      <Plane size={36} strokeWidth={1.2} color="var(--text-muted)" />
                    </div>
                    <h3>No trips yet</h3>
                    {isOwnProfile && (
                      <Link to="/trips" className="btn btn-primary btn-sm">Plan a Trip</Link>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {userTrips.map(trip => (
                      <div key={trip.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{trip.destination}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From {trip.departureCity}</div>
                          </div>
                          <span className="badge badge-primary">{trip.budget}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                          <Calendar size={13} />
                          {trip.startDate} → {trip.endDate} · {trip.duration} days
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {trip.activities.map(a => <span key={a} className="tag">{a}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Safety — other profiles only */}
          {!isOwnProfile && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                <Flag size={13} /> Report User
              </button>
              <button className="btn btn-danger btn-sm" style={{ gap: 6 }}>
                <Shield size={13} /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ──────────────────────────────── */}
      {editing && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEditing(false)}>
          <div className="modal-content profile-edit-modal-content">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close-btn" onClick={() => setEditing(false)}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
              </button>
            </div>

            <div className="edit-form-grid">
              {/* Column 1 */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.name || ''}
                  onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editData.phone || ''}
                  onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current City</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.city || ''}
                  onChange={e => setEditData(p => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.nationality || ''}
                  onChange={e => setEditData(p => ({ ...p, nationality: e.target.value }))}
                  placeholder="e.g. Indian"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={editData.age || ''}
                  onChange={e => setEditData(p => ({ ...p, age: parseInt(e.target.value) || '' }))}
                  placeholder="25"
                  min={18}
                  max={99}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={editData.gender || ''}
                  onChange={e => setEditData(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Travel Style</label>
                <select
                  className="form-select"
                  value={editData.travelStyle || ''}
                  onChange={e => setEditData(p => ({ ...p, travelStyle: e.target.value }))}
                >
                  <option value="">Select style</option>
                  {['Backpacker', 'Budget', 'Mid-Range', 'Luxury', 'Cultural', 'Adventure', 'Digital Nomad'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group budget-field-group">
                <label className="form-label">Budget</label>
                <div className="budget-input-wrap">
                  {/* Currency selector */}
                  <select
                    className="budget-currency-select"
                    value={editData.budgetCurrency || 'INR'}
                    onChange={e => setEditData(p => ({ ...p, budgetCurrency: e.target.value, budget: p.budgetAmount ? `${e.target.value === 'INR' ? '₹' : e.target.value === 'USD' ? '$' : e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : 'د.إ'}${p.budgetAmount}/${p.budgetPer || 'day'}` : p.budget }))}
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                    <option value="AED">د.إ AED</option>
                  </select>

                  {/* Amount input */}
                  <input
                    type="number"
                    className="budget-amount-input"
                    placeholder="e.g. 5000"
                    min={0}
                    value={editData.budgetAmount || ''}
                    onChange={e => {
                      const amt = e.target.value;
                      const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' }[editData.budgetCurrency || 'INR'];
                      const per = editData.budgetPer || 'day';
                      setEditData(p => ({
                        ...p,
                        budgetAmount: amt,
                        budget: amt ? `${sym}${amt}/${per}` : '',
                      }));
                    }}
                  />

                  {/* Per day / per trip toggle */}
                  <div className="budget-per-toggle">
                    {['day', 'trip'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`budget-per-btn ${(editData.budgetPer || 'day') === opt ? 'active' : ''}`}
                        onClick={() => {
                          const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' }[editData.budgetCurrency || 'INR'];
                          const amt = editData.budgetAmount || '';
                          setEditData(p => ({
                            ...p,
                            budgetPer: opt,
                            budget: amt ? `${sym}${amt}/${opt}` : '',
                          }));
                        }}
                      >
                        /{opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick preset chips */}
                <div className="budget-presets">
                  {[
                    { label: '🎒 Budget', amount: '1000', per: 'day' },
                    { label: '✈️ Mid-range', amount: '3000', per: 'day' },
                    { label: '💎 Luxury', amount: '8000', per: 'day' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      className="budget-preset-chip"
                      onClick={() => {
                        const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' }[editData.budgetCurrency || 'INR'];
                        setEditData(p => ({
                          ...p,
                          budgetAmount: preset.amount,
                          budgetPer: preset.per,
                          budget: `${sym}${preset.amount}/${preset.per}`,
                        }));
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {editData.budget && (
                  <div className="budget-preview">
                    💰 Your budget: <strong>{editData.budget}</strong>
                  </div>
                )}
              </div>

              {/* Profile Photo */}
              <div className="form-group">

                <label className="form-label">Profile Photo URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editData.avatar || editData.photos?.[0] || ''}
                  onChange={e => {
                    const url = e.target.value;
                    setEditData(p => ({ ...p, avatar: url, photos: url ? [url] : [] }));
                  }}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {/* Languages Spoken */}
              <div className="form-group">
                <label className="form-label">Languages Spoken (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={Array.isArray(editData.languages) ? editData.languages.join(', ') : (editData.languages || '')}
                  onChange={e => {
                    const raw = e.target.value;
                    const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                    setEditData(p => ({ ...p, languages: arr }));
                  }}
                  placeholder="English, Hindi, Spanish"
                />
              </div>

              {/* Interests */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Interests & Hobbies (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={Array.isArray(editData.interests) ? editData.interests.join(', ') : (editData.interests || '')}
                  onChange={e => {
                    const raw = e.target.value;
                    const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                    setEditData(p => ({ ...p, interests: arr }));
                  }}
                  placeholder="Hiking, Photography, Street Food, Yoga, Surfing"
                />
              </div>
            </div>

            {/* Full-width bio */}
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Bio</label>
              <textarea
                className="form-textarea"
                value={editData.bio || ''}
                onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Tell other travelers about yourself, your travel philosophy, and dream destinations..."
              />
            </div>


            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
