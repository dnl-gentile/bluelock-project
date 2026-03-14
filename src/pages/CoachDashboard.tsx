import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Shield, Users, TrendingUp, Calendar, Zap, MessageSquare, PlayCircle, Settings, CheckCircle2 } from 'lucide-react';

// Fake Data for Trainee linked to Coach
const MOCK_TRAINEE_DATA = {
  name: 'Filho (Treinado)',
  rank: 'V',
  xp: 1450,
  streak: 3,
  workoutsCompleted: 12,
  lastWorkout: 'Ontem',
};

const MOCK_TRAINING_PLAN = [
  { id: 1, title: 'Aceleração de Resposta', emoji: '⚡️', type: 'velocidade' },
  { id: 2, title: 'Drible Fantasma (Tesoura)', emoji: '👻', type: 'drible' },
  { id: 3, title: 'Finalização Seca', emoji: '🔥', type: 'chute' },
];

export default function CoachDashboard() {
  const { profile } = useAuth();
  const [editingPlan, setEditingPlan] = useState(false);

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 uppercase tracking-tighter text-shadow-neon">
            Visão do Mestre
          </h1>
          <p className="text-slate-400 font-mono text-sm capitalize">Painel de Acompanhamento do Treinador</p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 bg-[#0a0e17] px-4 py-2 rounded-xl border border-white/5">
          <Shield className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold uppercase tracking-widest text-orange-500">{profile?.name || 'Treinador'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trainee Stats Overview */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
            <Users className="w-6 h-6 text-slate-400 mb-2" />
            <h3 className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-1">Jogador</h3>
            <span className="font-bold text-white leading-tight">{MOCK_TRAINEE_DATA.name}</span>
          </div>

          <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-6 h-6 text-[#1d4ed8] mb-2" />
            <h3 className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-1">Evolução</h3>
            <span className="font-bold text-white leading-tight">Rank {MOCK_TRAINEE_DATA.rank}</span>
            <span className="text-[10px] text-[#1d4ed8] font-mono">{MOCK_TRAINEE_DATA.xp} XP</span>
          </div>

          <div className="bg-gradient-to-b from-orange-500/10 to-transparent p-5 rounded-2xl border border-orange-500/20 flex flex-col justify-center items-center text-center">
            <Zap className="w-6 h-6 text-orange-500 mb-2 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            <h3 className="text-xs uppercase font-mono tracking-widest text-orange-500 mb-1">Ofensiva</h3>
            <span className="font-bold text-white text-xl leading-tight">{MOCK_TRAINEE_DATA.streak} Dias</span>
          </div>

          <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
            <CheckCircle2 className="w-6 h-6 text-[#3b82f6] mb-2" />
            <h3 className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-1">Exercícios</h3>
            <span className="font-bold text-white text-xl leading-tight">{MOCK_TRAINEE_DATA.workoutsCompleted}</span>
            <span className="text-[10px] text-slate-400 font-mono">Último: {MOCK_TRAINEE_DATA.lastWorkout}</span>
          </div>
        </div>

        {/* Coach Assistant Chat Widget */}
        <div className="lg:col-span-1 bg-[#162032] p-6 rounded-3xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1d4ed8]" />
              <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-[#1d4ed8]">AI Coach Assist</h3>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0e17] rounded-xl p-4 border border-white/5 overflow-y-auto mb-4 text-sm text-slate-400 space-y-4 max-h-[150px]">
            <p><strong className="text-white">Blue Lock Men:</strong> O garoto está focado em Drible essa semana. Deseja introduzir treinos de Chute amanhã para variar?</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Digite um comando..."
              className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#1d4ed8] font-mono text-xs"
            />
            <button className="bg-orange-500 text-black px-4 rounded-xl text-xs font-bold uppercase hover:bg-orange-400 transition-colors">
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Daily Training Editor */}
      <div className="bg-[#050505] p-6 md:p-8 rounded-3xl border border-white/10 box-shadow-neon relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Calendar className="w-48 h-48 text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 w-full gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Plano de Treino do Dia</h2>
            <p className="text-slate-400 text-sm">Controle as atividades delegadas ao Treinado hoje.</p>
          </div>
          <button 
            onClick={() => setEditingPlan(!editingPlan)}
            className="flex items-center gap-2 bg-[#162032] border border-white/10 px-4 py-2 rounded-xl text-sm font-bold uppercase transition-all hover:bg-white/5 text-white"
          >
            <Settings className="w-4 h-4" /> {editingPlan ? 'Salvar Plano' : 'Editar Plano'}
          </button>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          {MOCK_TRAINING_PLAN.map((drill) => (
            <div key={drill.id} className="bg-[#0a0e17] border border-white/5 p-4 rounded-xl flex items-center justify-between group transition-colors hover:bg-[#162032]">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{drill.emoji}</span>
                <div>
                  <h3 className="font-bold text-white uppercase">{drill.title}</h3>
                  <p className="text-xs font-mono text-slate-500 uppercase">{drill.type}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {editingPlan ? (
                  <button className="text-xs font-bold uppercase text-red-400 bg-red-400/10 px-3 py-1.5 rounded border border-red-400/20 hover:bg-red-400/20">
                    Remover
                  </button>
                ) : (
                  <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1d4ed8]/20 transition-all">
                    <PlayCircle className="w-4 h-4 text-slate-400 group-hover:text-[#1d4ed8]" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {editingPlan && (
            <button className="w-full mt-2 border-2 border-dashed border-white/10 p-4 rounded-xl text-slate-400 font-bold uppercase tracking-wider text-sm hover:border-orange-500/50 hover:text-orange-500 transition-colors">
              + Adicionar Novo Exercício
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
