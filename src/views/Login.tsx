import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, UserPlus, Shield, Loader2 } from 'lucide-react';
import BlueLockLogo from '../components/BlueLockLogo';

export default function Login() {
  const { loginWithGoogle, loginAnonymously, user, profile, setRole } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<'google' | 'anon' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
    } finally {
      setLoading(null);
    }
  };

  const handleAnon = async () => {
    setError(null);
    setLoading('anon');
    try {
      await loginAnonymously();
    } catch (e: any) {
      setError(e?.message || 'Erro: o acesso anônimo pode estar desativado no Firebase Console.');
    } finally {
      setLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto space-y-8 px-4">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto flex items-center justify-center mb-6 drop-shadow-[0_0_24px_rgba(29,78,216,0.7)]">
            <BlueLockLogo size={96} className="rounded-2xl" />
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

  if (user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto space-y-8 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Identifique-se
          </h2>
          <p className="text-slate-400">Qual o seu papel no projeto Blue Lock?</p>
        </div>

        <div className="w-full bg-[#0a0e17] p-8 rounded-3xl border border-[#1d4ed8]/20 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-mono uppercase tracking-widest">Seu Nome/Apelido</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Isagi Yoichi"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1d4ed8] font-mono text-sm"
            />
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest text-center">Selecione o Caminho</p>
            
            <button
              disabled={name.length < 2}
              onClick={() => setRole('trainee', name)}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#162032] to-[#0a0e17] border border-[#1d4ed8]/30 p-4 flex items-center gap-4 transition-all hover:border-[#1d4ed8] disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center group-hover:bg-[#1d4ed8]/20 transition-colors">
                <BlueLockLogo size={28} className="text-[#1d4ed8]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold uppercase tracking-wider">O Egoísta (Filho)</h3>
                <p className="text-xs text-slate-400">Vou seguir o protocolo de treinos.</p>
              </div>
            </button>

            <button
              disabled={name.length < 2}
              onClick={() => setRole('coach', name)}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#162032] to-[#0a0e17] border border-[#c084fc]/30 p-4 flex items-center gap-4 transition-all hover:border-[#c084fc] disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-[#c084fc]/10 flex items-center justify-center group-hover:bg-[#c084fc]/20 transition-colors">
                <Shield className="w-6 h-6 text-[#c084fc]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold uppercase tracking-wider">O Mestre (Pai/Treinador)</h3>
                <p className="text-xs text-slate-400">Vou gerenciar e avaliar os talentos.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // Will be redirected by protected route
}
