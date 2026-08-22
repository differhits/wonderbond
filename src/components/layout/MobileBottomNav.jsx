import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, MessageCircle, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/matches', icon: Heart, label: 'Matches' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { unreadMessages, unreadCount } = useApp();

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to ||
          (to !== '/dashboard' && location.pathname.startsWith(to));

        const badge =
          label === 'Messages' && unreadMessages > 0 ? unreadMessages :
          label === 'Home' && unreadCount > 0 ? unreadCount :
          null;

        return (
          <Link
            key={to}
            to={to}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={22} />
              {badge && (
                <span className="mobile-nav-badge">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{label}</span>
            {isActive && <div className="mobile-nav-indicator" />}
          </Link>
        );
      })}
    </nav>
  );
}
