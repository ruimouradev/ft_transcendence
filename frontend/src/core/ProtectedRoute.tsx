import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Porta das rotas que exigem sessão: enquanto o /me não responde
// mostra-se a espera, sem sessão vai-se para o login, com sessão
// renderiza-se a rota filha (o Outlet).
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        Checking your session...
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
