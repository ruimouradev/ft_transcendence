import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        Loading session...
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};