import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Search, LayoutDashboard, Compass, Heart, Briefcase,
  MessageCircle, User, Globe, MapPin, Calendar, DollarSign, X,
  Crown, Settings, LogOut, Menu, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationPanel from '../notifications/NotificationPanel';
import './Topbar.css';

const NAV_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/matches',   icon: Heart,           label: 'Matches' },
  { to: '/map',       icon: MapPin,          label: 'Travel Map' },
  { to: '/trips',     icon: Briefcase,       label: 'Trips' },
  { to: '/messages',  icon: MessageCircle,   label: 'Messages' },
  { to: '/admin',     icon: Crown,           label: 'Admin Hub', isSpecial: true },
  { to: '/profile',   icon: User,            label: 'Profile' },
];

const BUDGET_OPTIONS = ['Any', 'Budget', 'Mid-range', 'Luxury'];

function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('Any');
  const modalRef = useRef(null);

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
  const { user, logout } = useAuth();
  const { unreadCount, unreadMessages } = useApp();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Close drawer on route navigation
  useEffect(() => {
    setShowMobileDrawer(false);
  }, [location.pathname]);

  const avatar = user?.photos?.[0] || user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=E84B0F&color=fff`;

  return (
    <>
      <header className="topbar">
        {/* Mobile Left: Hamburger button + Logo */}
        <div className="topbar-mobile-left">
          <button
            className="mobile-drawer-toggle-btn"
            onClick={() => setShowMobileDrawer(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/dashboard" className="topbar-mobile-logo">
            <div className="topbar-logo-icon">
              <Globe size={16} color="white" />
            </div>
            <span className="topbar-mobile-logo-text">WonderBond</span>
          </Link>
        </div>

        {/* Desktop: center nav links */}
        <nav className="topbar-nav">
          {NAV_LINKS.map(({ to, icon: Icon, label, isSpecial }) => {
            const isActive = location.pathname === to ||
              (to !== '/discover' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`topbar-nav-link ${isActive ? 'active' : ''} ${isSpecial ? 'topbar-nav-admin' : ''}`}
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
          {/* Mobile search trigger */}
          <button
            className="mobile-search-btn btn-icon"
            onClick={() => setShowSearch(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

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
                src={avatar}
                alt={user.name}
                className="avatar avatar-sm"
              />
            </Link>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE FULL NAVIGATION DRAWER ─────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {showMobileDrawer && (
        <div className="mobile-drawer-overlay animate-fadeIn" onClick={() => setShowMobileDrawer(false)}>
          <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <div className="topbar-logo-icon">
                  <Globe size={18} color="white" />
                </div>
                <span className="mobile-drawer-title">WonderBond</span>
              </div>
              <button className="btn-icon" onClick={() => setShowMobileDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            {/* User Profile Card in Drawer */}
            {user && (
              <Link to="/profile" className="mobile-drawer-user-card" onClick={() => setShowMobileDrawer(false)}>
                <img src={avatar} alt={user.name} className="avatar avatar-md" />
                <div className="mobile-drawer-user-info">
                  <div className="mobile-drawer-user-name">
                    {user.name}
                    {user.verified && <ShieldCheck size={14} color="#43e97b" />}
                  </div>
                  <div className="mobile-drawer-user-email">{user.email}</div>
                  <span className="badge badge-primary badge-xs" style={{ marginTop: 4 }}>
                    {user.travelStyle || 'Explorer'}
                  </span>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
              </Link>
            )}

            {/* Drawer Navigation Links */}
            <nav className="mobile-drawer-nav">
              {[
                { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Home overview & recommendations' },
                { to: '/discover',  icon: Compass,         label: 'Discover Partners', desc: 'Swipe & find travel matches' },
                { to: '/map',       icon: MapPin,          label: 'Travel Map', desc: 'Interactive global hotspot map', isHot: true },
                { to: '/trips',     icon: Briefcase,       label: 'Trips & Itineraries', desc: 'Create & join travel trips' },
                { to: '/matches',   icon: Heart,           label: 'Matches', desc: 'Your connected travel buddies' },
                { to: '/messages',  icon: MessageCircle,   label: 'Messages', desc: 'Live chat & conversation history', badge: unreadMessages },
                { to: '/admin',     icon: Crown,           label: 'Admin Hub', desc: 'Full user & partner management', isAdmin: true },
                { to: '/profile',   icon: User,            label: 'My Profile', desc: 'Edit bio, photos & preferences' },
                { to: '/settings',  icon: Settings,        label: 'Settings & Verification', desc: 'Phone OTP, ID verify & theme' },
              ].map(({ to, icon: Icon, label, desc, isHot, isAdmin, badge }) => {
                const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`mobile-drawer-link ${isActive ? 'active' : ''} ${isAdmin ? 'mobile-drawer-admin' : ''}`}
                    onClick={() => setShowMobileDrawer(false)}
                  >
                    <div className="mobile-drawer-icon-wrap">
                      <Icon size={20} />
                    </div>
                    <div className="mobile-drawer-link-text">
                      <div className="mobile-drawer-link-label">
                        {label}
                        {isHot && <span className="drawer-chip-hot">HOT</span>}
                        {isAdmin && <span className="drawer-chip-admin">HUB</span>}
                      </div>
                      <div className="mobile-drawer-link-desc">{desc}</div>
                    </div>
                    {badge > 0 && (
                      <span className="notif-badge" style={{ marginLeft: 'auto' }}>{badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="mobile-drawer-footer">
              <button
                className="mobile-drawer-logout-btn"
                onClick={() => {
                  setShowMobileDrawer(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}
