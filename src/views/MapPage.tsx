import { motion } from 'framer-motion';
import { Lock, PlayCircle, Star, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const FASES = [
  {
    id: 1,
    title: 'Fase 1: Base do Atleta',
    idade: '6-8 anos',
    description: 'Foco na coordenação motora e na paixão pelo jogo.',
    status: 'completed',
  },
  {
    id: 2,
    title: 'Fase 2: O Despertar da Arma',
    idade: '9-11 anos',
    description: 'Foco em treino diário, repetição, desenvolvimento de habilidades técnicas específicas (chute, drible ou velocidade) e construção da autoconfiança (o "Ego" positivo).',
    status: 'active',
  },
  {
    id: 3,
    title: 'Fase 3: Visão de Jogo',
    idade: '12-14 anos',
    description: 'Foco em inteligência tática, antecipação de jogadas e entendimento do campo.',
    status: 'locked',
  },
  {
    id: 4,
    title: 'Fase 4: O Mestre do Ego',
    idade: '15+ anos',
    description: 'Autonomia total, foco em alto rendimento e profissionalização.',
    status: 'locked',
  },
];

export default function MapPage() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] uppercase tracking-tighter text-shadow-neon">
          Projeto Blue Lock
        </h1>
        <p className="text-slate-400 font-medium">O Caminho para se tornar o Número 1.</p>
      </div>

      <div className="relative border-l-2 border-[#162032] ml-4 md:ml-0 md:pl-0">
        {FASES.map((fase, index) => (
          <motion.div
            key={fase.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`relative pl-8 md:pl-10 pb-16 last:pb-0 ${
              fase.status === 'active' ? 'opacity-100' : 'opacity-60 hover:opacity-100 transition-opacity'
            }`}
          >
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 ${
                fase.status === 'completed'
                  ? 'bg-[#1d4ed8] border-[#0a0e17] box-shadow-neon'
                  : fase.status === 'active'
                  ? 'bg-[#ff003c] border-[#0a0e17] animate-pulse-neon'
                  : 'bg-[#162032] border-[#0a0e17]'
              }`}
            />

            <div
              className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                fase.status === 'completed'
                  ? 'border-[#1d4ed8]/30 bg-[#1d4ed8]/5'
                  : fase.status === 'active'
                  ? 'border-[#ff003c]/50 bg-[#ff003c]/10 box-shadow-neon scale-[1.02]'
                  : 'border-white/5 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  fase.status === 'active' ? 'bg-[#ff003c] text-white' : 'bg-[#162032] text-slate-300'
                }`}>
                  IDADE {fase.idade}
                </span>
                {fase.status === 'completed' && <Star className="text-[#1d4ed8] w-5 h-5" />}
                {fase.status === 'active' && <PlayCircle className="text-[#ff003c] w-5 h-5 animate-pulse" />}
                {fase.status === 'locked' && <Lock className="text-slate-500 w-5 h-5" />}
              </div>
              
              <h3 className={`text-2xl font-display font-bold mb-2 ${
                fase.status === 'locked' ? 'text-slate-500' : 'text-white'
              }`}>
                {fase.title}
              </h3>
              
              <p className={fase.status === 'locked' ? 'text-slate-600' : 'text-slate-300'}>
                {fase.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-mono text-sm uppercase tracking-widest"
      >
        <LogOut className="w-4 h-4" />
        Sair da Conta
      </button>

    </div>
  );
}
