import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, Target, Bookmark, Check, X, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBlueLockContentStore } from '@store/useBlueLockContentStore';
import { useAthleteProfileStore } from '@store/useAthleteProfileStore';

const focusOptions = [
  { id: 'velocidade', label: 'Velocidade' },
  { id: 'drible', label: 'Drible' },
  { id: 'chute', label: 'Chute' },
  { id: 'passe', label: 'Passe' },
  { id: 'mentalidade', label: 'Leitura' },
  { id: 'resistencia', label: 'Resistência' },
] as const;

export default function TrainingRoom() {
  const router = useRouter();
  const trainingPlan = useBlueLockContentStore((state) => state.trainingPlan);
  const pendingTrainingPlan = useBlueLockContentStore((state) => state.pendingTrainingPlan);
  const trainingPresets = useBlueLockContentStore((state) => state.trainingPresets);
  const activatePendingTrainingPlan = useBlueLockContentStore((state) => state.activatePendingTrainingPlan);
  const dismissPendingTrainingPlan = useBlueLockContentStore((state) => state.dismissPendingTrainingPlan);
  const saveTrainingPreset = useBlueLockContentStore((state) => state.saveTrainingPreset);
  const savePendingTrainingAsPreset = useBlueLockContentStore((state) => state.savePendingTrainingAsPreset);
  const activateTrainingPreset = useBlueLockContentStore((state) => state.activateTrainingPreset);
  const removeTrainingPreset = useBlueLockContentStore((state) => state.removeTrainingPreset);
  const preferences = useAthleteProfileStore((state) => state.preferences);
  const setPreferences = useAthleteProfileStore((state) => state.setPreferences);
  const [expandedDrill, setExpandedDrill] = useState<number | null>(trainingPlan.drills[0]?.id ?? null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    setExpandedDrill(trainingPlan.drills[0]?.id ?? null);
  }, [trainingPlan.updatedAt, trainingPlan.drills]);

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto h-full">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase text-shadow-neon">
            {trainingPlan.title}
          </h1>
          <p className="text-[#1d4ed8] font-mono text-sm capitalize">{todayStr}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPresetsOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#1d4ed8]/30 bg-[#162032] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#60a5fa]"
          >
            <Bookmark className="h-4 w-4" />
            Presets
          </button>
          
          <div className="flex items-center gap-2 text-slate-400 bg-[#0a0e17] px-4 py-2 rounded-xl border border-white/5">
            <Target className="w-4 h-4 text-[#ff003c]" />
            <span className="text-sm font-mono uppercase tracking-widest text-[#ff003c]">Foco: {trainingPlan.focus}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.82fr)] gap-6 items-start">
        
        {/* Drills List */}
        <div className="space-y-4">
          {pendingTrainingPlan && (
            <div className="rounded-3xl border border-[#1d4ed8]/30 bg-[#162032] p-5 box-shadow-neon">
              <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#60a5fa]">
                Sugestão da {pendingTrainingPlan.suggestedBy === 'daily_routine' ? 'rotina diária' : 'Anri'}
              </p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
                {pendingTrainingPlan.title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{pendingTrainingPlan.rationale}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={activatePendingTrainingPlan}
                  className="rounded-full bg-[#1d4ed8] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Trocar treino atual
                  </span>
                </button>
                <button
                  onClick={() => savePendingTrainingAsPreset()}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-300"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Salvar preset
                  </span>
                </button>
                <button
                  onClick={dismissPendingTrainingPlan}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Manter treino atual
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-500 font-mono tracking-widest uppercase mb-2">
                {trainingPlan.source === 'anri' ? 'Protocolo calibrado pela Anri' : 'Protocolo gerado automático'}
              </p>
              <p className="text-sm text-slate-400">
                {trainingPlan.rationale}
              </p>
            </div>
          </div>
          
          {trainingPlan.drills.map((drill) => {
            const isExpanded = expandedDrill === drill.id;
            return (
              <motion.div 
                key={drill.id}
                initial={false}
                animate={{ backgroundColor: isExpanded ? '#162032' : '#0a0e17' }}
                className={`border rounded-2xl overflow-hidden transition-colors ${isExpanded ? 'border-[#1d4ed8]/50 box-shadow-neon' : 'border-white/10'}`}
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer select-none group"
                  onClick={() => setExpandedDrill(isExpanded ? null : drill.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-[#1d4ed8]/10 group-hover:border-[#1d4ed8]/30 transition-all">
                      {drill.emoji}
                    </div>
                    <div>
                      <h3 className={`font-bold uppercase tracking-wider ${isExpanded ? 'text-white' : 'text-slate-300'}`}>
                        {drill.title}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 uppercase">{drill.type}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-4 pt-2 pb-6 space-y-4">
                        <p className="text-sm text-slate-300">{drill.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-[#1d4ed8] font-mono tracking-widest uppercase">Pontos Chave:</p>
                          <ul className="space-y-2">
                            {drill.topics.map((topic, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-[#1d4ed8] mt-0.5 shrink-0" />
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Start Button & AI Tweaks */}
        <div className="grid gap-6 content-start">
          <Link 
            href={`/drill/${trainingPlan.drills[0]?.id ?? 1}`}
            className="w-full relative overflow-hidden group bg-gradient-to-br from-[#ff003c] to-[#990024] p-6 rounded-3xl flex flex-col items-center justify-center border border-[#ff003c]/50 hover:shadow-[0_0_40px_rgba(255,0,60,0.4)] transition-all cursor-pointer block text-center"
          >
            <div className="absolute inset-0 bg-[#1d4ed8] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
            <Play className="w-16 h-16 text-white mb-2 fill-white" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              INICIAR PROTOCOLO
            </h2>
            <p className="text-white/70 text-sm mt-1">Tempo Est.: 15 min</p>
          </Link>

          <div className="grid gap-3 pt-2">
            <p className="text-slate-400 font-mono text-xs uppercase mb-3 text-center">
              Quer recalibrar o protocolo de hoje?
            </p>
            <button
              onClick={() => router.push('/chat?q=Quero ajustar meu treino de hoje.')}
              className="w-full bg-[#162032] border border-[#1d4ed8]/30 hover:border-[#1d4ed8] rounded-2xl p-4 flex items-center justify-center gap-3 transition-colors box-shadow-neon"
            >
              <MessageSquare className="w-6 h-6 text-[#1d4ed8]" />
              <div className="text-left">
                <span className="block font-bold text-sm tracking-widest text-white uppercase">
                  Solicitar alteração para Anri
                </span>
                <span className="block text-xs text-slate-400">
                  Peça para Anri ajustar foco, carga ou adaptar o treino de hoje.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0a0e17] px-4 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-300"
            >
              <Settings2 className="h-4 w-4 text-[#60a5fa]" />
              Configurar Anri
            </button>
          </div>
        </div>
      </div>

      {isPresetsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0a0e17] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#60a5fa]">Presets</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Biblioteca de treino</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetsOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => saveTrainingPreset(trainingPlan.title)}
                className="rounded-full border border-[#1d4ed8]/30 bg-[#1d4ed8]/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#60a5fa]"
              >
                Salvar treino atual
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto pr-1 no-scrollbar">
              {trainingPresets.length > 0 ? (
                trainingPresets.map((preset) => (
                  <div key={preset.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">{preset.name}</p>
                        <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">
                          {preset.plan.focus}
                        </p>
                      </div>
                      <button
                        onClick={() => removeTrainingPreset(preset.id)}
                        className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500"
                      >
                        remover
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{preset.plan.rationale}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          activateTrainingPreset(preset.id);
                          setIsPresetsOpen(false);
                        }}
                        className="rounded-full bg-white px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-black"
                      >
                        Ativar manualmente
                      </button>
                      <button
                        onClick={() => {
                          setIsPresetsOpen(false);
                          router.push(`/chat?q=${encodeURIComponent(`Ative o preset ${preset.name} no meu treino atual.`)}`);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-300"
                      >
                        Pedir para Anri ativar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-5 text-sm text-slate-500">
                  Nenhum preset salvo ainda. Quando um treino encaixar, guarda ele aqui.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPreferencesOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0a0e17] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#60a5fa]">Preferências da Anri</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Como Bernardo quer treinar</h3>
                <p className="mt-2 text-sm text-slate-400">
                  A rotina diária e os ajustes da Anri passam a usar essas preferências.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 max-h-[55vh] overflow-y-auto pr-1 no-scrollbar">
              <div className="flex flex-wrap gap-2">
                {focusOptions.map((option) => {
                  const isActive = preferences.preferredFocuses.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        setPreferences({
                          preferredFocuses: isActive
                            ? preferences.preferredFocuses.filter((focus) => focus !== option.id)
                            : [...preferences.preferredFocuses, option.id],
                        })
                      }
                      className={`rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
                        isActive
                          ? 'bg-[#1d4ed8] text-white'
                          : 'border border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">Estilo da sessão</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { id: 'balanced', label: 'Balanceado' },
                      { id: 'aggressive', label: 'Agressivo' },
                      { id: 'recovery', label: 'Recuperação' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setPreferences({ sessionStyle: style.id as typeof preferences.sessionStyle })}
                        className={`rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] ${
                          preferences.sessionStyle === style.id
                            ? 'bg-white text-black'
                            : 'border border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-white">Preferir outdoor quando der</p>
                    <p className="text-xs text-slate-500">Se chover, a Anri recua para protocolos mais seguros.</p>
                  </div>
                  <button
                    onClick={() => setPreferences({ prefersOutdoor: !preferences.prefersOutdoor })}
                    className={`rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] ${
                      preferences.prefersOutdoor
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'border border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    {preferences.prefersOutdoor ? 'Ligado' : 'Desligado'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
