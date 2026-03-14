'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, type UserRole } from '../lib/AuthContext';
import { Bot } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.replace('/login');
      } else if (allowedRoles && !allowedRoles.includes(profile.role)) {
        router.replace(profile.role === 'coach' ? '/coach' : '/');
      }
    }
  }, [loading, user, profile, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        <Bot className="w-12 h-12 text-[#1d4ed8] animate-pulse" />
        <p className="mt-4 text-[#1d4ed8] font-mono animate-pulse">CARREGANDO PROTOCOLOS...</p>
      </div>
    );
  }

  if (!user || !profile) return null;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
}
