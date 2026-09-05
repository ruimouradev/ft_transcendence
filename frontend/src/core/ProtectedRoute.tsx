import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute()
{
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        Checking your session...
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{from: location}} replace />;
};

export default ProtectedRoute