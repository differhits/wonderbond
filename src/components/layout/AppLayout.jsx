import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const location = useLocation();

  // Messages page needs full-height without overflow
  const isMessages = location.pathname.startsWith('/messages');

  return (
    <div className="app-layout">
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <Sidebar />

      <div className="app-main">
        <Topbar />
        <main className="app-content" style={isMessages ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — shown only on mobile via CSS */}
      <MobileBottomNav />
    </div>
  );
}
