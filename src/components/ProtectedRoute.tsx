import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../lib/AuthContext';
import { Bot } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        <Bot className="w-12 h-12 text-[#1d4ed8] animate-pulse" />
        <p className="mt-4 text-[#1d4ed8] font-mono animate-pulse">CARREGANDO PROTOCOLOS...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Se for pai querendo acessar área de filho, ou filho querendo acessar área de pai
    return <Navigate to={profile.role === 'coach' ? '/coach' : '/'} replace />;
  }

  return <Outlet />;
}
