import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, Calendar, DollarSign, MapPin, Plus, Trash2, X, Users, Loader, RefreshCw, CheckCircle, Navigation
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../context/AppContext';
import { getCommunityTripsAPI, getMyTripsAPI, createTripAPI, deleteTripAPI } from '../../services/tripService';
import { getCityCoordinates } from '../../utils/geoCoordinates';
import './TripsPage.css';

const ACTIVITIES_OPTIONS = [
  'Hiking', 'Beach', 'Surfing', 'Scuba Diving', 'Safari', 'Food Tour',
  'Cultural Tour', 'Photography', 'Yoga', 'Trekking', 'Coworking',
  'Nightlife', 'Camping', 'Sailing', 'Skiing', 'Cycling',
];

const QUICK_DESTINATIONS = [
  { name: 'Goa, India', lat: 15.2993, lng: 74.1240 },
  { name: 'Bali, Indonesia', lat: -8.4095, lng: 115.1889 },
  { name: 'Manali, Himachal', lat: 32.2396, lng: 77.1887 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Leh-Ladakh, India', lat: 34.1526, lng: 77.5771 },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Kyoto, Japan', lat: 35.0116, lng: 135.7681 },
];

// ── Create Trip Modal with Interactive Map Picker ─────────────────────────────
function CreateTripModal({ onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    destination: initialData?.destination || '',
    departureCity: initialData?.departureCity || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    budget: initialData?.budget || 'Mid-range',
    purpose: initialData?.purpose || '',
    activities: initialData?.activities || [],
    description: initialData?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(true);

  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);
  const pinMarkerRef = useRef(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleActivity = (a) => {
    setForm(p => ({
      ...p,
      activities: p.activities.includes(a)
        ? p.activities.filter(x => x !== a)
        : [...p.activities, a],
    }));
  };

  const duration = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000)
    : 0;

  // Initialize Mini Map
  useEffect(() => {
    if (!miniMapRef.current || miniMapInstance.current) return;

    const map = L.map(miniMapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 4,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map click handler to select destination
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        pinMarkerRef.current = L.marker([lat, lng]).addTo(map);
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.state || data.address?.country || 'Destination';
        const country = data.address?.country ? `, ${data.address.country}` : '';
        update('destination', `${city}${country}`);
      } catch {
        update('destination', `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
      }
    });

    miniMapInstance.current = map;

    return () => {
      map.remove();
      miniMapInstance.current = null;
    };
  }, []);

  // When destination changes, update map pin
  const selectQuickDest = (dest) => {
    update('destination', dest.name);
    if (miniMapInstance.current) {
      miniMapInstance.current.flyTo([dest.lat, dest.lng], 6, { duration: 1.2 });
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([dest.lat, dest.lng]);
      } else {
        pinMarkerRef.current = L.marker([dest.lat, dest.lng]).addTo(miniMapInstance.current);
      }
    }
  };

  const handleSave = async () => {
    if (!form.destination || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await onSave({ ...form, duration });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>✈️ Create a New Trip</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pick destination on the map or type to plan your trip</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Destination & Departure Row */}
          <div className="modal-grid">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Destination *</label>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--brand-primary)' }}
                  onClick={() => setShowMapPicker(p => !p)}
                >
                  <MapPin size={12} /> {showMapPicker ? 'Hide Map' : 'Show Map'}
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bali, Indonesia or Goa"
                value={form.destination}
                onChange={e => {
                  const val = e.target.value;
                  update('destination', val);
                  if (val.length > 2) {
                    const coords = getCityCoordinates(val);
                    if (miniMapInstance.current) {
                      miniMapInstance.current.panTo([coords.lat, coords.lng]);
                      if (pinMarkerRef.current) pinMarkerRef.current.setLatLng([coords.lat, coords.lng]);
                      else pinMarkerRef.current = L.marker([coords.lat, coords.lng]).addTo(miniMapInstance.current);
                    }
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departure City</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mumbai, Delhi"
                value={form.departureCity}
                onChange={e => update('departureCity', e.target.value)}
              />
            </div>
          </div>

          {/* Interactive Map Picker */}
          {showMapPicker && (
            <div className="trip-mini-map-wrap">
              <div ref={miniMapRef} className="trip-mini-map" />
              <div className="trip-mini-map-hint">
                <MapPin size={12} color="#E84B0F" />
                <span>Click anywhere on the map to pin destination</span>
              </div>
            </div>
          )}

          {/* Quick Destination Chips */}
          <div className="quick-dest-chips">
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>POPULAR:</span>
            {QUICK_DESTINATIONS.map(d => (
              <button
                key={d.name}
                type="button"
                className={`quick-dest-btn ${form.destination === d.name ? 'active' : ''}`}
                onClick={() => selectQuickDest(d)}
              >
                {d.name.split(',')[0]}
              </button>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input"
                value={form.startDate} onChange={e => update('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input type="date" className="form-input"
                value={form.endDate} onChange={e => update('endDate', e.target.value)} />
            </div>
          </div>

          {duration > 0 && (
            <div style={{ textAlign: 'center', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              🗓️ {duration} day trip
            </div>
          )}

          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Budget</label>
              <select className="form-select" value={form.budget} onChange={e => update('budget', e.target.value)}>
                {['Budget', 'Mid-range', 'Luxury'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trip Purpose</label>
              <input type="text" className="form-input" placeholder="Adventure, Cultural, Digital Nomad..."
                value={form.purpose} onChange={e => update('purpose', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3}
              placeholder="Tell travelers about your trip — where you'll go, what you'll do..."
              value={form.description} onChange={e => update('description', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Activities</label>
            <div className="tag-selector">
              {ACTIVITIES_OPTIONS.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`tag-option ${form.activities.includes(a) ? 'selected' : ''}`}
                  onClick={() => toggleActivity(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.destination || !form.startDate || !form.endDate}>
              {saving ? <><Loader size={14} className="spin-anim" /> Saving…</> : <><Plus size={14} /> Create Trip</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trip Card ─────────────────────────────────────────────────────────────────
function TripCard({ trip, onDelete, mine }) {
  const avatar = trip.userId?.photos?.[0] || trip.userId?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.userId?.name || 'U')}&background=E84B0F&color=fff`;

  return (
    <div className="trip-card-main card">
      <div className="trip-card-main-header">
        <div className="trip-dest-icon"><Globe size={20} /></div>
        <div style={{ flex: 1 }}>
          <h3 className="trip-card-main-dest">{trip.destination}</h3>
          {trip.departureCity && (
            <div className="trip-card-main-from"><MapPin size={11} /> From {trip.departureCity}</div>
          )}
        </div>
        {onDelete && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(trip._id || trip.id)} title="Delete Trip">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="trip-card-main-dates">
        <Calendar size={13} /> {trip.startDate} → {trip.endDate}
        {trip.duration > 0 && (
          <span className="badge badge-primary" style={{ marginLeft: 8 }}>{trip.duration} days</span>
        )}
      </div>

      {trip.description && <p className="trip-card-main-desc">"{trip.description}"</p>}

      <div className="trip-card-main-bottom">
        <span className="badge badge-warning"><DollarSign size={11} /> {trip.budget}</span>
        {trip.purpose && <span className="badge">{trip.purpose}</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
        {trip.activities?.map(a => <span key={a} className="tag">{a}</span>)}
      </div>

      {/* Community: show who posted */}
      {!mine && trip.userId && (
        <div className="trip-card-poster">
          <img
            src={avatar}
            alt={trip.userId.name || 'User'}
            className="avatar avatar-xs"
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.userId?.name || 'U')}&background=E84B0F&color=fff`; }}
          />
          <span>{trip.userId.name}</span>
          {trip.userId.verified && <CheckCircle size={11} style={{ color: '#2D9B8A' }} />}
          {trip.userId.city && <span className="trip-poster-city">· {trip.userId.city}</span>}
        </div>
      )}
    </div>
  );
}

import { useLocation } from 'react-router-dom';

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TripsPage() {
  const { addNotification } = useApp();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(Boolean(location.state?.create || location.state?.prefill));
  const [initialTripData, setInitialTripData] = useState(location.state?.prefill || null);
  const [tab, setTab] = useState(location.state?.tab || 'mine');

  const [myTrips, setMyTrips] = useState([]);
  const [communityTrips, setCommunityTrips] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch my trips
  const fetchMyTrips = useCallback(async () => {
    setMyLoading(true);
    setError(null);
    try {
      const data = await getMyTripsAPI();
      setMyTrips(data);
    } catch (err) {
      setError('Could not load your trips');
    } finally {
      setMyLoading(false);
    }
  }, []);

  // Fetch community trips
  const fetchCommunityTrips = useCallback(async () => {
    setCommunityLoading(true);
    setError(null);
    try {
      const data = await getCommunityTripsAPI();
      setCommunityTrips(data);
    } catch (err) {
      setError('Could not load community trips');
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'mine') fetchMyTrips();
    else fetchCommunityTrips();
  }, [tab, fetchMyTrips, fetchCommunityTrips]);

  const handleCreate = async (data) => {
    try {
      const newTrip = await createTripAPI(data);
      setMyTrips(prev => [newTrip, ...prev]);
      addNotification({
        type: 'match',
        message: `✈️ Trip to ${data.destination} created! Other travelers can see it in Community Trips.`,
      });
      setShowCreate(false);
    } catch (err) {
      alert(err.message || 'Error creating trip');
    }
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await deleteTripAPI(tripId);
      setMyTrips(prev => prev.filter(t => (t._id || t.id) !== tripId));
    } catch (err) {
      alert(err.message || 'Error deleting trip');
    }
  };

  const activeTrips = tab === 'mine' ? myTrips : communityTrips;
  const loading = tab === 'mine' ? myLoading : communityLoading;

  return (
    <div className="trips-page">
      {/* Header */}
      <div className="trips-header">
        <div>
          <h1 className="page-title">Trips</h1>
          <p className="page-subtitle">Plan trips and find travel companions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Trip
        </button>
      </div>

      {/* Tabs */}
      <div className="trips-tabs">
        <button
          className={`trips-tab ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
          My Trips ({myTrips.length})
        </button>
        <button
          className={`trips-tab ${tab === 'community' ? 'active' : ''}`}
          onClick={() => setTab('community')}
        >
          <Users size={14} style={{ marginRight: 4 }} />
          Community Trips ({communityTrips.length})
        </button>
      </div>

      {/* Content */}
      <div className="trips-content">
        {loading && (
          <div className="trips-loading">
            <Loader size={28} className="spin-anim" />
            <p>Loading trips from database…</p>
          </div>
        )}

        {error && !loading && (
          <div className="trips-error">
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={tab === 'mine' ? fetchMyTrips : fetchCommunityTrips}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && activeTrips.length === 0 && (
          <div className="trips-empty">
            <Globe size={48} strokeWidth={1.2} />
            <h3>{tab === 'mine' ? 'No trips planned yet' : 'No community trips yet'}</h3>
            <p>
              {tab === 'mine'
                ? 'Create a trip to let other travelers discover you!'
                : 'Be the first to post a public trip!'}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Plan a Trip
            </button>
          </div>
        )}

        {!loading && !error && activeTrips.length > 0 && (
          <div className="trips-grid">
            {activeTrips.map(trip => (
              <TripCard
                key={trip._id || trip.id}
                trip={trip}
                onDelete={tab === 'mine' ? handleDelete : null}
                mine={tab === 'mine'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showCreate && (
        <CreateTripModal
          onClose={() => { setShowCreate(false); setInitialTripData(null); }}
          onSave={handleCreate}
          initialData={initialTripData}
        />
      )}
    </div>
  );
}
