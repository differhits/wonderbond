import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, LayoutDashboard, Compass, Heart, Briefcase, MessageCircle, User, Globe, MapPin, Calendar, DollarSign, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationPanel from '../notifications/NotificationPanel';
import './Topbar.css';

const NAV_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/matches', icon: Heart, label: 'Matches' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/trips', icon: Briefcase, label: 'Trips' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];


const BUDGET_OPTIONS = ['Any', 'Budget', 'Mid-range', 'Luxury'];

function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('Any');
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (budget !== 'Any') params.set('budget', budget);
    navigate(`/discover?${params.toString()}`);
    onClose();
  };

  return (
    <div className="search-modal-backdrop">
      <div className="search-modal" ref={modalRef}>
        <div className="search-modal-header">
          <span className="search-modal-title">Find Travel Partners</span>
          <button className="search-modal-close btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="search-modal-fields">
          {/* Destination */}
          <div className="search-modal-field">
            <div className="search-field-icon"><MapPin size={15} /></div>
            <div className="search-field-body">
              <label className="search-field-label">Destination</label>
              <input
                autoFocus
                type="text"
                className="search-field-input"
                placeholder="Where do you want to go?"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="search-modal-divider" />

          {/* Dates */}
          <div className="search-modal-field">
            <div className="search-field-icon"><Calendar size={15} /></div>
            <div className="search-field-body search-field-dates">
              <div className="search-date-half">
                <label className="search-field-label">From</label>
                <input
                  type="date"
                  className="search-field-input"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="search-date-sep" />
              <div className="search-date-half">
                <label className="search-field-label">To</label>
                <input
                  type="date"
                  className="search-field-input"
                  value={endDate}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="search-modal-divider" />

          {/* Budget */}
          <div className="search-modal-field">
            <div className="search-field-icon"><DollarSign size={15} /></div>
            <div className="search-field-body">
              <label className="search-field-label">Budget</label>
              <div className="search-budget-chips">
                {BUDGET_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`search-budget-chip ${budget === opt ? 'active' : ''}`}
                    onClick={() => setBudget(opt)}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="search-modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setDestination(''); setStartDate(''); setEndDate(''); setBudget('Any');
          }}>
            Clear all
          </button>
          <button className="btn btn-primary search-modal-submit" onClick={handleSearch}>
            <Search size={15} /> Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Topbar() {
  const { user } = useAuth();
  const { unreadCount } = useApp();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="topbar">
        {/* Mobile: logo */}
        <div className="topbar-mobile-logo">
          <div className="topbar-logo-icon">
            <Globe size={16} color="white" />
          </div>
          <span className="topbar-mobile-logo-text">WonderBond</span>
        </div>

        {/* Desktop: center nav links */}
        <nav className="topbar-nav">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to ||
              (to !== '/discover' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`topbar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop: search pill — opens modal */}
        <div
          className="topbar-search-pill"
          onClick={() => setShowSearch(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setShowSearch(true)}
          aria-label="Open search"
        >
          <span className="topbar-pill-item">Dates</span>
          <span className="topbar-pill-item">Destination</span>
          <span className="topbar-pill-item">Budget</span>
          <span className="topbar-pill-search-btn" aria-label="Search">
            <Search size={14} />
          </span>
        </div>

        {/* Right actions */}
        <div className="topbar-right">
          <button
            className={`topbar-notif btn-icon ${showNotifs ? 'active' : ''}`}
            onClick={() => setShowNotifs(v => !v)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge topbar-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user && (
            <Link to="/profile" className="topbar-avatar">
              <img
                src={user.photos?.[0] || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=E84B0F&color=fff`}
                alt={user.name}
                className="avatar avatar-sm"
              />
            </Link>
          )}
        </div>
      </header>

      {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}
