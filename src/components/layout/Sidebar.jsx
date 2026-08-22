import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Compass, Heart, Briefcase, MessageCircle, User,
  Settings, LogOut, Globe, Crown, ChevronLeft, ChevronRight, Menu, Map
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/matches',   icon: Heart,           label: 'Matches' },
  { to: '/map',       icon: Map,             label: 'Travel Map' },
  { to: '/trips',     icon: Briefcase,       label: 'Trips' },
  { to: '/messages',  icon: MessageCircle,   label: 'Messages' },
  { to: '/profile',   icon: User,            label: 'Profile' },
];


export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadMessages } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const avatar = user?.photos?.[0] || user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=E84B0F&color=fff`;

  return (
    <>
      {/* Floating expand trigger if collapsed */}
      {collapsed && (
        <button className="sidebar-open-fab" onClick={() => setCollapsed(false)} aria-label="Open sidebar" title="Open sidebar">
          <Menu size={18} />
        </button>
      )}

      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Logo row with collapse toggle */}
        <div className="sidebar-logo-row">
          {!collapsed && (
            <Link to="/dashboard" className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <Globe size={18} color="white" />
              </div>
              <span className="sidebar-logo-text">WonderBond</span>
            </Link>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to ||
              (to !== '/discover' && location.pathname.startsWith(to));
            const badge = label === 'Messages' && unreadMessages > 0 ? unreadMessages : null;
            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? label : undefined}
              >
                <span className="sidebar-link-icon"><Icon size={19} /></span>
                {!collapsed && <span className="sidebar-link-label">{label}</span>}
                {badge && !collapsed && <span className="notif-badge sidebar-badge">{badge}</span>}
                {badge && collapsed && <span className="sidebar-badge-dot" />}
              </Link>
            );
          })}

          {/* Admin link — accessible for all users */}
          <Link
            to="/admin"
            className={`sidebar-link sidebar-link-admin ${location.pathname === '/admin' ? 'active' : ''}`}
            title={collapsed ? 'Admin Hub' : undefined}
          >
            <span className="sidebar-link-icon"><Crown size={19} /></span>
            {!collapsed && <span className="sidebar-link-label">Admin Hub</span>}
          </Link>
        </nav>

        {/* Bottom user & settings */}
        <div className="sidebar-bottom">
          <Link
            to="/settings"
            className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
            <span className="sidebar-link-icon"><Settings size={19} /></span>
            {!collapsed && <span className="sidebar-link-label">Settings</span>}
          </Link>

          {user && (
            <div className={`sidebar-user ${collapsed ? 'sidebar-user-mini' : ''}`}>
              <img
                src={avatar}
                alt={user.name}
                className="avatar avatar-sm"
                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=E84B0F&color=fff`; }}
              />
              {!collapsed && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">
                    {user.name}
                    {user.role === 'admin' && <Crown size={11} style={{ color: '#FFD700', marginLeft: 4 }} />}
                  </span>
                  <span className="sidebar-user-status">● Online</span>
                </div>
              )}
              {!collapsed && (
                <button className="sidebar-logout" onClick={logout} title="Log out">
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
