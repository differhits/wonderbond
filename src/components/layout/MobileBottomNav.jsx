import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, Heart, MessageCircle, MapPin, Crown, Briefcase, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/map',       icon: MapPin,          label: 'Map' },
  { to: '/trips',     icon: Briefcase,       label: 'Trips' },
  { to: '/matches',   icon: Heart,           label: 'Matches' },
  { to: '/messages',  icon: MessageCircle,   label: 'Chat' },
  { to: '/admin',     icon: Crown,           label: 'Admin' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { unreadMessages, unreadCount } = useApp();

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Main mobile navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to ||
          (to !== '/dashboard' && location.pathname.startsWith(to));

        const badge =
          (label === 'Chat' || label === 'Messages') && unreadMessages > 0 ? unreadMessages :
          label === 'Home' && unreadCount > 0 ? unreadCount :
          null;

        return (
          <Link
            key={to}
            to={to}
            className={`mobile-nav-item ${isActive ? 'active' : ''} ${label === 'Admin' ? 'mobile-nav-admin' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} />
              {badge && (
                <span className="mobile-nav-badge">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
