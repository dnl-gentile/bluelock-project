'use client';
// Triggering build with configured secrets
import { useState, useEffect } from 'react';
import { useAuth } from '@lib/AuthContext';
import { LogIn, UserPlus, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CoachLogin() {
  const { loginWithGoogle, loginAnonymously, user, profile, setRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If coach login specifically, once authenticated, we must set role as coach if lacking profile
  useEffect(() => {
    if (user && !profile) {
      setRole('coach', user.displayName || 'Treinador');
    }
  }, [user, profile, setRole]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'coach') {
        router.replace('/coach');
      } else {
        setError('Você já está logado como atleta. Por favor, deslogue primeiro para entrar como treinador.');
      }
    }
  }, [user, profile, router]);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAnonymously();
    } catch (e: any) {
      setError(e?.message || 'Login anônimo desativado — ative em Firebase Console.');
      setLoading(false);
    }
  };

  if (user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        <Shield className="w-16 h-16 text-orange-500 animate-pulse" />
        <p className="mt-4 text-orange-500 font-mono animate-pulse">AUTENTICANDO TREINADOR...</p>
      </div>
    );
  }

  if (user && profile && profile.role === 'coach') return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto space-y-8 px-4">
      <div className="text-center space-y-4">
        <div className="mb-6 flex items-center justify-center">
          <Shield className="w-24 h-24 text-orange-500" />
        </div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 uppercase tracking-tighter">
          Acesso Treinador
        </h1>
        <p className="text-slate-400 font-mono text-sm">PAINEL DE GESTÃO DO PROJETO</p>
      </div>

      <div className="w-full space-y-4 bg-[#0a0e17] p-8 rounded-3xl border border-orange-500/20">
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-xs font-mono px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          Autenticar como Mestre
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-mono uppercase">Ou</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleAnon}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
          Acesso Temporário (Anônimo)
        </button>
      </div>
    </div>
  );
}
