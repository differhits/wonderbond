import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Compass, Navigation, Users, Plane, Heart, MessageCircle,
  Search, Filter, CheckCircle, Star, Sparkles, X, ChevronRight, Eye,
  Layers, Flame, Radio, Plus, Calendar, DollarSign, Clock, ShieldCheck,
  Send, Sun, CloudRain, Thermometer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getCityCoordinates, CITY_COORDINATES } from '../../utils/geoCoordinates';
import { getCommunityTripsAPI } from '../../services/tripService';
import './TravelMapPage.css';

// ── Tile Layers Configuration ────────────────────────────────────────────────
const TILE_LAYERS = {
  voyager: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  dark: {
    name: 'Midnight',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
  },
};

// ── Top Travel Hotspots Data ─────────────────────────────────────────────────
const POPULAR_HOTSPOTS = [
  {
    name: 'Goa, India',
    lat: 15.2993,
    lng: 74.1240,
    category: 'Beach & Nightlife',
    bestTime: 'Nov – Feb',
    avgBudget: '₹2,500/day',
    temp: '29°C',
    weather: 'Sunny',
    highlights: ['Anjuna Flea Market', 'Scuba in Grande Island', 'Fort Aguada Sunset', 'Beach Shacks'],
    description: 'India\'s coastal paradise known for vibrant beach parties, Portuguese architecture, and laidback susegad lifestyle.',
  },
  {
    name: 'Bali, Indonesia',
    lat: -8.4095,
    lng: 115.1889,
    category: 'Tropical & Spiritual',
    bestTime: 'Apr – Oct',
    avgBudget: '$60/day',
    temp: '28°C',
    weather: 'Tropical',
    highlights: ['Ubud Rice Terraces', 'Canggu Surf Breaks', 'Uluwatu Sunset Temple', 'Mount Batur Sunrise Trek'],
    description: 'The Island of Gods offering lush jungles, world-class surfing, yoga retreats, and digital nomad hubs.',
  },
  {
    name: 'Manali, Himachal',
    lat: 32.2396,
    lng: 77.1887,
    category: 'Mountains & Adventure',
    bestTime: 'Oct – Jun',
    avgBudget: '₹2,000/day',
    temp: '14°C',
    weather: 'Crisp & Mountain',
    highlights: ['Solang Valley Paragliding', 'Rohtang Pass Snow', 'Old Manali Cafes', 'Jogini Waterfalls'],
    description: 'Gateway to high-altitude Himalayan treks, backpacker cafes, pine valleys, and snow sports.',
  },
  {
    name: 'Tokyo, Japan',
    lat: 35.6762,
    lng: 139.6503,
    category: 'Futuristic & Culture',
    bestTime: 'Mar – May & Sep – Nov',
    avgBudget: '$120/day',
    temp: '21°C',
    weather: 'Clear',
    highlights: ['Shibuya Crossing', 'Shinjuku Omoide Yokocho', 'Akihabara Tech District', 'Senso-ji Temple'],
    description: 'A dazzling juxtaposition of ultra-modern skyscrapers, ancient temples, anime subcultures, and Michelin dining.',
  },
  {
    name: 'Leh-Ladakh, India',
    lat: 34.1526,
    lng: 77.5771,
    category: 'High Altitude Desert',
    bestTime: 'May – Sep',
    avgBudget: '₹3,500/day',
    temp: '16°C',
    weather: 'Sunny & Cool',
    highlights: ['Pangong Tso Lake', 'Nubra Valley Sand Dunes', 'Khardung La Pass (17,982 ft)', 'Monasteries'],
    description: 'Land of high passes, crystal-blue glacial lakes, centuries-old Buddhist gompas, and motorcycling adventures.',
  },
  {
    name: 'Paris, France',
    lat: 48.8566,
    lng: 2.3522,
    category: 'Art, Romance & Cuisine',
    bestTime: 'Apr – Oct',
    avgBudget: '€110/day',
    temp: '19°C',
    weather: 'Breezy',
    highlights: ['Eiffel Tower at Night', 'Louvre Museum', 'Montmartre Artists', 'Seine River Cruise'],
    description: 'The global capital of art, gastronomy, fashion, and romantic strolls along cobbled boulevards.',
  },
];

// ── Haversine Distance Helper ────────────────────────────────────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ── Main Travel Map Page ──────────────────────────────────────────────────────
export default function TravelMapPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroup = useRef(null);
  const flightPathLayer = useRef(null);
  const radarCircleLayer = useRef(null);

  const { users, addMatch, addNotification, onlineUsers } = useApp();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [beacons, setBeacons] = useState([
    {
      id: 'b1',
      title: 'Sunrise trek to Chapora Fort 🌅',
      city: 'Goa',
      lat: 15.6069,
      lng: 73.7380,
      creator: 'Priya Nair',
      time: 'Tomorrow, 6:00 AM',
      spots: 3,
    },
    {
      id: 'b2',
      title: 'Street Food Crawl in Old Delhi 🍛',
      city: 'Delhi',
      lat: 28.6507,
      lng: 77.2334,
      creator: 'Rohan Mehta',
      time: 'This Saturday, 5:00 PM',
      spots: 4,
    },
  ]);

  const [activeLayer, setActiveLayer] = useState('voyager'); // 'voyager' | 'dark' | 'satellite'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'travelers' | 'trips' | 'hotspots' | 'beacons'
  const [radiusKm, setRadiusKm] = useState(0); // 0 = worldwide, > 0 = radius limit
  const [searchCity, setSearchCity] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // traveler, trip, hotspot, beacon
  const [myCoords, setMyCoords] = useState([19.0760, 72.8777]); // Default Mumbai
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showBeaconModal, setShowBeaconModal] = useState(false);
  const [newBeacon, setNewBeacon] = useState({ title: '', city: 'Goa', time: 'Tomorrow 10:00 AM', spots: 2 });
  const [calculatedDistance, setCalculatedDistance] = useState(null);

  // Fetch community trips
  useEffect(() => {
    getCommunityTripsAPI().then(res => setTrips(res)).catch(() => setTrips([]));
  }, []);

  // ── Initialize Leaflet Map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });

    tileLayerRef.current = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersGroup.current = L.featureGroup().addTo(map);
    flightPathLayer.current = L.layerGroup().addTo(map);
    radarCircleLayer.current = L.layerGroup().addTo(map);

    mapInstance.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── Switch Tile Layer ───────────────────────────────────────────────────────
  const changeTileLayer = (layerKey) => {
    if (!mapInstance.current || !tileLayerRef.current) return;
    mapInstance.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[layerKey].url, {
      attribution: TILE_LAYERS[layerKey].attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstance.current);
    setActiveLayer(layerKey);
  };

  // ── Detect User's Location (GPS) ────────────────────────────────────────────
  const locateMe = useCallback(() => {
    if (!navigator.geolocation || !mapInstance.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMyCoords(coords);
        mapInstance.current.flyTo(coords, 11, { duration: 1.6 });
        setLocating(false);
      },
      () => {
        // Fallback Mumbai
        setMyCoords([19.0760, 72.8777]);
        setLocating(false);
      }
    );
  }, []);

  // ── Search City ─────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCity || !mapInstance.current) return;
    const coords = getCityCoordinates(searchCity);
    mapInstance.current.flyTo([coords.lat, coords.lng], 9, { duration: 1.4 });
  };

  // ── Draw Interactive Flight Path & Distance ─────────────────────────────────
  const drawFlightPath = useCallback((targetCoords, targetName) => {
    if (!mapInstance.current || !flightPathLayer.current || !myCoords) return;
    flightPathLayer.current.clearLayers();

    const [lat1, lon1] = myCoords;
    const { lat: lat2, lng: lon2 } = targetCoords;

    const dist = calculateDistance(lat1, lon1, lat2, lon2);
    const flightHours = (dist / 650).toFixed(1);
    setCalculatedDistance({ km: dist, flightHours });

    // Draw Great-circle / Bezier curved line
    const midLat = (lat1 + lat2) / 2 + (Math.abs(lon2 - lon1) > 20 ? 4 : 2);
    const midLon = (lon1 + lon2) / 2;

    const polyline = L.polyline([
      [lat1, lon1],
      [midLat, midLon],
      [lat2, lon2],
    ], {
      color: '#E84B0F',
      weight: 3,
      dashArray: '8, 8',
      opacity: 0.85,
    });

    polyline.addTo(flightPathLayer.current);
  }, [myCoords]);

  // ── Clear Flight Path when closed ───────────────────────────────────────────
  const handleCloseSheet = () => {
    setSelectedItem(null);
    setCalculatedDistance(null);
    flightPathLayer.current?.clearLayers();
  };

  // ── Update Radar Circle (Radius Filter) ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !radarCircleLayer.current || !mapInstance.current) return;
    radarCircleLayer.current.clearLayers();

    if (radiusKm > 0 && myCoords) {
      const circle = L.circle(myCoords, {
        radius: radiusKm * 1000,
        color: '#2D9B8A',
        fillColor: '#2D9B8A',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '6, 6',
      });
      circle.addTo(radarCircleLayer.current);
      mapInstance.current.fitBounds(circle.getBounds(), { padding: [40, 40] });
    }
  }, [radiusKm, myCoords, mapReady]);

  // ── Render Map Markers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !markersGroup.current) return;

    markersGroup.current.clearLayers();
    const map = mapInstance.current;

    // 1. My GPS Location Pin
    if (myCoords) {
      const myIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="my-gps-marker">
            <div class="my-gps-dot"></div>
            <div class="my-gps-pulse"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker(myCoords, { icon: myIcon })
        .bindPopup(`<b>📍 Your Base Location</b><br/>Connecting to travelers nearby`)
        .addTo(markersGroup.current);
    }

    // 2. Traveler Pins
    if (filterType === 'all' || filterType === 'travelers') {
      users.forEach((u, idx) => {
        if (currentUser && (u._id === currentUser._id || u.email === currentUser.email)) return;

        const coords = getCityCoordinates(u.city || u.nationality || 'Mumbai', idx);

        // Apply radius filter if active
        if (radiusKm > 0 && myCoords) {
          const d = calculateDistance(myCoords[0], myCoords[1], coords.lat, coords.lng);
          if (d > radiusKm) return;
        }

        const avatar = u.photos?.[0] || u.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=E84B0F&color=fff`;

        const isUserOnline = onlineUsers.includes(u._id || u.id);

        const travelerIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div class="traveler-map-pin ${u.verified ? 'verified-pin' : ''}">
              <img src="${avatar}" class="pin-avatar" alt="${u.name}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=E84B0F&color=fff'" />
              ${isUserOnline ? '<span class="pin-online-dot"></span>' : ''}
              ${u.verified ? '<span class="pin-verified-badge">✓</span>' : ''}
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: travelerIcon });

        marker.on('click', () => {
          setSelectedItem({ type: 'traveler', data: u, coords });
          drawFlightPath(coords, u.name);
          map.panTo([coords.lat, coords.lng]);
        });

        marker.addTo(markersGroup.current);
      });
    }

    // 3. Community Trip Pins
    if (filterType === 'all' || filterType === 'trips') {
      trips.forEach((t, idx) => {
        const coords = getCityCoordinates(t.destination || 'Goa', idx + 10);

        if (radiusKm > 0 && myCoords) {
          const d = calculateDistance(myCoords[0], myCoords[1], coords.lat, coords.lng);
          if (d > radiusKm) return;
        }

        const tripIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div class="trip-map-pin">
              <div class="trip-pin-icon">✈️</div>
              <div class="trip-pin-label">${t.destination?.split(',')[0]}</div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: tripIcon });

        marker.on('click', () => {
          setSelectedItem({ type: 'trip', data: t, coords });
          drawFlightPath(coords, t.destination);
          map.panTo([coords.lat, coords.lng]);
        });

        marker.addTo(markersGroup.current);
      });
    }

    // 4. Curated Global Hotspots Pins
    if (filterType === 'all' || filterType === 'hotspots') {
      POPULAR_HOTSPOTS.forEach((h) => {
        const hotspotIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div class="hotspot-map-pin">
              <span class="hotspot-flame">🔥</span>
              <span class="hotspot-title">${h.name.split(',')[0]}</span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([h.lat, h.lng], { icon: hotspotIcon });

        marker.on('click', () => {
          setSelectedItem({ type: 'hotspot', data: h, coords: { lat: h.lat, lng: h.lng } });
          drawFlightPath({ lat: h.lat, lng: h.lng }, h.name);
          map.panTo([h.lat, h.lng]);
        });

        marker.addTo(markersGroup.current);
      });
    }

    // 5. Travel Beacons (Quick meet-ups)
    if (filterType === 'all' || filterType === 'beacons') {
      beacons.forEach((b) => {
        const beaconIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div class="beacon-map-pin">
              <div class="beacon-icon">⚡</div>
              <div class="beacon-wave"></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([b.lat, b.lng], { icon: beaconIcon });

        marker.on('click', () => {
          setSelectedItem({ type: 'beacon', data: b, coords: { lat: b.lat, lng: b.lng } });
          drawFlightPath({ lat: b.lat, lng: b.lng }, b.title);
          map.panTo([b.lat, b.lng]);
        });

        marker.addTo(markersGroup.current);
      });
    }
  }, [mapReady, users, trips, beacons, filterType, radiusKm, myCoords, onlineUsers, currentUser, drawFlightPath]);

  const handleLikeUser = (u) => {
    addNotification({
      type: 'like',
      message: `You liked ${u.name}'s profile from Travel Map! ⭐`,
      avatar: u.photos?.[0] || u.avatar,
      userId: u._id || u.id,
    });
    addMatch(u._id || u.id);
  };

  const handleCreateBeacon = (e) => {
    e.preventDefault();
    if (!newBeacon.title) return;
    const coords = getCityCoordinates(newBeacon.city || 'Goa');
    const created = {
      id: 'b-' + Date.now(),
      title: newBeacon.title,
      city: newBeacon.city,
      lat: coords.lat,
      lng: coords.lng,
      creator: currentUser?.name || 'You',
      time: newBeacon.time,
      spots: newBeacon.spots,
    };
    setBeacons(prev => [created, ...prev]);
    setShowBeaconModal(false);
    addNotification({
      type: 'match',
      message: `⚡ Travel Beacon dropped in ${newBeacon.city}! Travelers nearby can see it.`,
    });
  };

  return (
    <div className="travel-map-page">
      {/* ── Top Map Floating Bar ───────────────────────────────── */}
      <div className="map-floating-top">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <Search size={16} className="map-search-icon" />
          <input
            type="text"
            className="map-search-input"
            placeholder="Search city, country or destination..."
            value={searchCity}
            onChange={e => setSearchCity(e.target.value)}
          />
          <button type="submit" className="map-search-btn">Go</button>
        </form>

        {/* Filter Pills */}
        <div className="map-filters-row">
          <button
            className={`map-filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <Compass size={14} /> All ({users.length + trips.length + POPULAR_HOTSPOTS.length})
          </button>
          <button
            className={`map-filter-pill ${filterType === 'travelers' ? 'active' : ''}`}
            onClick={() => setFilterType('travelers')}
          >
            <Users size={14} /> Travelers ({users.length})
          </button>
          <button
            className={`map-filter-pill ${filterType === 'trips' ? 'active' : ''}`}
            onClick={() => setFilterType('trips')}
          >
            <Plane size={14} /> Trips ({trips.length})
          </button>
          <button
            className={`map-filter-pill ${filterType === 'hotspots' ? 'active' : ''}`}
            onClick={() => setFilterType('hotspots')}
          >
            <Flame size={14} color="#F59E0B" /> Hotspots ({POPULAR_HOTSPOTS.length})
          </button>
          <button
            className={`map-filter-pill ${filterType === 'beacons' ? 'active' : ''}`}
            onClick={() => setFilterType('beacons')}
          >
            <Radio size={14} color="#8B5CF6" /> Meetup Beacons ({beacons.length})
          </button>
        </div>

        {/* Action controls right */}
        <div className="map-top-actions">
          {/* Radius selector */}
          <select
            className="map-radius-select"
            value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            title="Radar search radius"
          >
            <option value={0}>🌍 Worldwide</option>
            <option value={100}>🎯 Within 100 km</option>
            <option value={500}>🎯 Within 500 km</option>
            <option value={1500}>🎯 Within 1500 km</option>
          </select>

          {/* Layer switcher */}
          <div className="map-layer-toggle">
            {Object.keys(TILE_LAYERS).map(k => (
              <button
                key={k}
                className={`layer-btn ${activeLayer === k ? 'active' : ''}`}
                onClick={() => changeTileLayer(k)}
                title={`${TILE_LAYERS[k].name} Map View`}
              >
                {TILE_LAYERS[k].name}
              </button>
            ))}
          </div>

          {/* Drop Beacon button */}
          <button
            className="btn btn-primary btn-sm map-beacon-btn"
            onClick={() => setShowBeaconModal(true)}
            title="Drop a travel meet-up beacon"
          >
            <Plus size={14} /> Post Beacon
          </button>

          {/* Locate me */}
          <button
            className="map-filter-pill locate-pill"
            onClick={locateMe}
            disabled={locating}
            title="Locate my GPS position"
          >
            <Navigation size={14} /> {locating ? 'Locating…' : 'GPS'}
          </button>
        </div>
      </div>

      {/* ── Leaflet Container ──────────────────────────────────── */}
      <div ref={mapRef} className="leaflet-map-container" />

      {/* ── Flight Distance HUD Badge (Top Center when item selected) ─ */}
      {calculatedDistance && (
        <div className="flight-hud-badge animate-slideDown">
          <Plane size={15} color="#E84B0F" />
          <span>Distance: <strong>{calculatedDistance.km.toLocaleString()} km</strong></span>
          <span>·</span>
          <span>~<strong>{calculatedDistance.flightHours} hrs</strong> flight</span>
        </div>
      )}

      {/* ── Map Stats Overlay (Bottom Left) ────────────────────── */}
      <div className="map-stats-badge">
        <span className="live-dot" />
        <strong>{users.length}</strong> travelers · <strong>{trips.length}</strong> trips · <strong>{POPULAR_HOTSPOTS.length}</strong> hotspots
      </div>

      {/* ── Selected Item Preview Drawer (Bottom Right) ────────── */}
      {selectedItem && (
        <div className="map-preview-sheet animate-slideUp">
          <button className="preview-close-btn" onClick={handleCloseSheet}>
            <X size={18} />
          </button>

          {/* 1. TRAVELER PREVIEW */}
          {selectedItem.type === 'traveler' && (
            <div className="traveler-preview-card">
              <div className="preview-header">
                <img
                  src={selectedItem.data.photos?.[0] || selectedItem.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedItem.data.name || 'U')}&background=E84B0F&color=fff`}
                  alt={selectedItem.data.name}
                  className="preview-avatar"
                />
                <div className="preview-user-info">
                  <div className="preview-name-row">
                    <h3>{selectedItem.data.name}{selectedItem.data.age ? `, ${selectedItem.data.age}` : ''}</h3>
                    {selectedItem.data.verified && <CheckCircle size={16} color="#2D9B8A" />}
                  </div>
                  <div className="preview-meta">
                    <MapPin size={12} color="#E84B0F" />
                    <span>{selectedItem.data.city || selectedItem.data.nationality || 'Traveler'}</span>
                  </div>
                  {selectedItem.data.travelStyle && (
                    <div className="preview-badges">
                      <span className="badge badge-primary">{selectedItem.data.travelStyle}</span>
                      {selectedItem.data.budget && <span className="badge badge-warning">{selectedItem.data.budget}</span>}
                    </div>
                  )}
                </div>
              </div>

              {selectedItem.data.bio && (
                <p className="preview-bio">"{selectedItem.data.bio}"</p>
              )}

              {selectedItem.data.interests?.length > 0 && (
                <div className="preview-tags">
                  {selectedItem.data.interests.slice(0, 4).map(i => (
                    <span key={i} className="tag">{i}</span>
                  ))}
                </div>
              )}

              <div className="preview-actions">
                <button
                  className="btn btn-primary btn-sm preview-match-btn"
                  onClick={() => handleLikeUser(selectedItem.data)}
                >
                  <Heart size={15} /> Match / Like
                </button>
                <Link
                  to={`/profile/${selectedItem.data._id || selectedItem.data.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={14} /> Profile
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    handleLikeUser(selectedItem.data);
                    navigate('/messages');
                  }}
                  title="Direct Message"
                >
                  <MessageCircle size={15} />
                </button>
              </div>
            </div>
          )}

          {/* 2. TRIP PREVIEW */}
          {selectedItem.type === 'trip' && (
            <div className="trip-preview-card">
              <div className="trip-preview-top">
                <div className="trip-preview-icon"><Plane size={22} color="white" /></div>
                <div>
                  <h3>{selectedItem.data.destination}</h3>
                  <div className="preview-meta">
                    {selectedItem.data.departureCity && `From ${selectedItem.data.departureCity} · `}
                    {selectedItem.data.startDate} → {selectedItem.data.endDate}
                  </div>
                </div>
              </div>

              {selectedItem.data.description && (
                <p className="preview-bio">"{selectedItem.data.description}"</p>
              )}

              <div className="preview-badges" style={{ marginTop: 8 }}>
                <span className="badge badge-primary">{selectedItem.data.duration} days</span>
                <span className="badge badge-warning">💰 {selectedItem.data.budget}</span>
                {selectedItem.data.purpose && <span className="badge">{selectedItem.data.purpose}</span>}
              </div>

              <div className="preview-actions" style={{ marginTop: 16 }}>
                <Link to="/trips" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  ✈️ View in Trips
                </Link>
              </div>
            </div>
          )}

          {/* 3. HOTSPOT PREVIEW */}
          {selectedItem.type === 'hotspot' && (
            <div className="hotspot-preview-card">
              <div className="hotspot-preview-header">
                <div>
                  <span className="hotspot-badge-tag"><Flame size={12} /> Hotspot Guide</span>
                  <h3>{selectedItem.data.name}</h3>
                  <div className="preview-meta">{selectedItem.data.category}</div>
                </div>
                <div className="hotspot-weather-box">
                  <Sun size={18} color="#F59E0B" />
                  <span>{selectedItem.data.temp}</span>
                </div>
              </div>

              <p className="preview-bio">{selectedItem.data.description}</p>

              <div className="hotspot-info-grid">
                <div>
                  <label>BEST SEASON</label>
                  <span>{selectedItem.data.bestTime}</span>
                </div>
                <div>
                  <label>AVG BUDGET</label>
                  <span>{selectedItem.data.avgBudget}</span>
                </div>
              </div>

              <div className="hotspot-highlights">
                <label>TOP ATTRACTIONS</label>
                <div className="preview-tags">
                  {selectedItem.data.highlights.map(h => (
                    <span key={h} className="tag">{h}</span>
                  ))}
                </div>
              </div>

              <div className="preview-actions" style={{ marginTop: 14 }}>
                <Link
                  to={`/discover?destination=${encodeURIComponent(selectedItem.data.name.split(',')[0])}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Find Buddies for {selectedItem.data.name.split(',')[0]}
                </Link>
              </div>
            </div>
          )}

          {/* 4. BEACON PREVIEW */}
          {selectedItem.type === 'beacon' && (
            <div className="beacon-preview-card">
              <div className="beacon-preview-header">
                <div className="beacon-pulse-icon">⚡</div>
                <div>
                  <span className="beacon-tag">Live Travel Meetup</span>
                  <h3>{selectedItem.data.title}</h3>
                  <div className="preview-meta">Posted by {selectedItem.data.creator} · {selectedItem.data.city}</div>
                </div>
              </div>

              <div className="beacon-details-box">
                <div><strong>⏰ Time:</strong> {selectedItem.data.time}</div>
                <div><strong>👥 Spots available:</strong> {selectedItem.data.spots} travelers</div>
              </div>

              <div className="preview-actions" style={{ marginTop: 14 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    addNotification({
                      type: 'tripInvite',
                      message: `You RSVP'd to meetup: "${selectedItem.data.title}" 🎉`,
                    });
                    navigate('/messages');
                  }}
                >
                  👋 Request to Join
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Drop Beacon Modal ──────────────────────────────────── */}
      {showBeaconModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowBeaconModal(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>⚡ Post a Travel Meetup Beacon</h3>
              <button className="btn-icon" onClick={() => setShowBeaconModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateBeacon} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Meetup Activity / Plan *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scuba diving in Grande Island tomorrow"
                  value={newBeacon.title}
                  onChange={e => setNewBeacon(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Goa, Manali, Bali"
                    value={newBeacon.city}
                    onChange={e => setNewBeacon(p => ({ ...p, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Spots (Travelers)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={10}
                    value={newBeacon.spots}
                    onChange={e => setNewBeacon(p => ({ ...p, spots: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">When / Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tomorrow 9:00 AM"
                  value={newBeacon.time}
                  onChange={e => setNewBeacon(p => ({ ...p, time: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBeaconModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Drop Beacon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
