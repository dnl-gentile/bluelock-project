'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BlueLockLogo from '../components/BlueLockLogo';

export default function Login() {
  const { loginWithGoogle, loginAnonymously, user, profile, setRole } = useAuth();
  const [loading, setLoading] = useState<'google' | 'anon' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Auto-set profile as Bernardo/trainee once user is authenticated but has no profile
  useEffect(() => {
    if (user && !profile) {
      setRole('trainee', 'Bernardo');
    }
  }, [user, profile]);

  // Redirect when profile is ready
  useEffect(() => {
    if (user && profile) {
      router.replace(profile.role === 'coach' ? '/coach' : '/');
    }
  }, [user, profile, router]);

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
      setLoading(null);
    }
  };

  const handleAnon = async () => {
    setError(null);
    setLoading('anon');
    try {
      await loginAnonymously();
    } catch (e: any) {
      setError(e?.message || 'Login anônimo desativado — ative em Firebase Console → Authentication → Anonymous.');
      setLoading(null);
    }
  };

  if (user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        <BlueLockLogo
          size={64}
          animated
          className="drop-shadow-[0_0_24px_rgba(59,130,246,0.2)]"
        />
        <p className="mt-4 text-[#1d4ed8] font-mono animate-pulse">CARREGANDO PROTOCOLOS...</p>
      </div>
    );
  }

  if (user && profile) return null; // redirect handled by useEffect

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto space-y-8 px-4">
      <div className="text-center space-y-4">
        <div className="mb-6 flex items-center justify-center">
          <BlueLockLogo
            size={96}
            animated
            animationStyle="pulse"
            durationMs={2200}
            className="drop-shadow-[0_0_28px_rgba(29,78,216,0.28)]"
          />
        </div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] uppercase tracking-tighter">
          Blue Lock
        </h1>
        <p className="text-slate-400 font-mono text-sm">PROJETO MESTRE DO JOGO</p>
      </div>

      <div className="w-full space-y-4 bg-[#0a0e17] p-8 rounded-3xl border border-[#1d4ed8]/20">
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-xs font-mono px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors disabled:opacity-60"
        >
          {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          Entrar com Google
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-mono">OU</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleAnon}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {loading === 'anon' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
          Acesso Rápido (Anônimo)
        </button>
      </div>
    </div>
  );
}
