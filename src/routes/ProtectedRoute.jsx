import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
