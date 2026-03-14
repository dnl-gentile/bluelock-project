import { useState } from 'react';
import { CloudRain, Sun, Zap, Flame, Calendar, ChevronRight, UserSquare, ArrowRightLeft, History, Dumbbell, Bell, MapPin, Info, X } from 'lucide-react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEgoStore } from '../store/useEgoStore';
import MapPage from './MapPage';
import { useAthleteProfileStore } from '@store/useAthleteProfileStore';
import { getAthleteStage, getBernardoAge } from '@lib/athlete-daily';
import { calculateAthletePerformanceMetrics } from '@lib/athlete-metrics';
import TrainingRankBadge from '@components/TrainingRankBadge';

const QUOTES = [
  "O talento é algo que você faz florescer, o instinto é algo que você poli. - Blue Lock",
  "Eu não sou perfeccionista, sou apenas exigente comigo mesmo. - Cristiano Ronaldo",
  "Seu 'Ego' é a única bússola confiável neste campo.",
  "Para ser o melhor, você deve acreditar que é o melhor.",
  "A verdadeira química ocorre quando dois Egos se chocam e se devoram."
];

export default function Home() {
  const { profile } = useAuth();
  const { history, xp, skills } = useEgoStore();
  const weather = useAthleteProfileStore((state) => state.weather);
  const dailyBriefing = useAthleteProfileStore((state) => state.dailyBriefing);
  const notifications = useAthleteProfileStore((state) => state.notifications);
  const markNotificationRead = useAthleteProfileStore((state) => state.markNotificationRead);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [viewMode, setViewMode] = useState<'streak' | 'calendar'>('streak');
  const [isStreakInfoOpen, setIsStreakInfoOpen] = useState(false);
  const performance = calculateAthletePerformanceMetrics({ xp, history, skills });
  const streak = performance.streak.current;
  const age = getBernardoAge();
  const stage = getAthleteStage(age);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const latestNotifications = notifications.slice(0, 3);
  const radarData = performance.radar.map((domain) => ({
    subject: domain.label,
    A: domain.score,
    fullMark: 100,
  }));
  const currentWeek = performance.streak.currentWeek;
  const matrixHighlights = [
    { label: 'Score Geral', value: `${performance.overallScore}%` },
    { label: 'Domínios', value: `${performance.distinctDomains}/6` },
    { label: 'Posição', value: `#${performance.leaderboardPosition}` },
  ];

  const isIndoorProtocol = weather?.condition === 'Rain';
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const nextPermission = await Notification.requestPermission();
    setNotificationPermission(nextPermission);
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto py-4">
      
      {/* User Hello & Weather Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0e17] p-5 rounded-3xl border border-white/5 box-shadow-neon">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Eaí, {profile?.name || 'Egoísta'}.
          </h1>
          <p className="text-sm text-slate-400 font-mono">Preparado para devorar o campo hoje?</p>
        </div>
        
        {weather && (
          <div className="flex items-center gap-3 bg-[#050505] p-3 rounded-2xl border border-white/10">
            {isIndoorProtocol ? (
              <CloudRain className="text-[#1d4ed8] animate-pulse" />
            ) : (
              <Sun className="text-[#ff003c] animate-pulse-neon" />
            )}
            <div>
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {weather.locationLabel || 'Clima local'}
              </p>
              <p className="text-white font-bold">{weather.temp}°C - {isIndoorProtocol ? 'INDOOR REC.' : 'OUTDOOR'}</p>
              <p className="text-[11px] text-slate-500">{weather.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6 items-stretch">
        <div className="bg-gradient-to-br from-[#162032] to-[#0a0e17] p-6 rounded-3xl border border-[#1d4ed8]/20 relative overflow-hidden flex flex-col justify-center min-h-[240px] h-full">
          <Zap className="absolute top-4 right-4 w-24 h-24 text-[#1d4ed8] opacity-5 -rotate-12" />
          <h3 className="text-xs text-[#1d4ed8] font-mono tracking-widest uppercase mb-2">Mensagem do Dia</h3>
          <p className="text-lg md:text-xl font-medium text-white max-w-[90%] italic">
            "{quote}"
          </p>
        </div>

        <div className="bg-gradient-to-b from-[#162032] to-[#0a0e17] p-6 rounded-3xl border border-white/10 h-full">
          <div className="flex items-center gap-2 mb-4">
            <UserSquare className="w-5 h-5 text-[#1d4ed8]" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">Ficha do Atleta</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-start gap-4">
                {profile?.photoURL && (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#1d4ed8]/30 bg-[#151922] p-[2px]">
                    <img
                      src={profile.photoURL}
                      alt={profile.name}
                      className="h-full w-full rounded-[14px] object-cover object-center"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                    {profile?.name || 'Bernardo'}
                  </h3>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.24em] text-[#1d4ed8]">
                    {age} anos · fase 2: {stage}
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
                    {dailyBriefing?.subheadline || 'A Anri ainda está lendo o seu ritmo do dia.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Dias treinados</p>
                  <p className="mt-1 text-lg font-black text-white">{performance.totalTrainingDays}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Armas abertas</p>
                  <p className="mt-1 text-lg font-black text-white">{performance.unlockedSkills}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Score geral</p>
                  <p className="mt-1 text-lg font-black text-white">{performance.overallScore}%</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Posição</p>
                  <p className="mt-1 text-lg font-black text-white">#{performance.leaderboardPosition}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-black/20 px-5 py-4">
              <TrainingRankBadge
                position={performance.leaderboardPosition}
                level={performance.level}
                className="w-[180px]"
              />
            </div>
          </div>
        </div>

        <div
          className="bg-[#050505] p-6 rounded-3xl border border-[#ff003c]/30 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-colors hover:border-[#ff003c]/70 min-h-[220px] h-full"
          onClick={() => setViewMode(viewMode === 'streak' ? 'calendar' : 'streak')}
        >
          <div className={`absolute inset-0 bg-gradient-to-b from-[#ff003c]/20 to-transparent transition-opacity ${viewMode === 'streak' ? 'opacity-20' : 'opacity-10'}`} />
          
          <button className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full z-10">
             <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsStreakInfoOpen(true);
            }}
            className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full z-10"
          >
            <Info className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait">
            {viewMode === 'streak' ? (
              <motion.div
                key="streak"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center w-full z-10"
              >
                <Flame className="w-10 h-10 text-[#ff003c] mb-2 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                <h3 className="text-sm text-slate-400 font-mono uppercase tracking-widest">Ofensiva Atual</h3>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-t from-[#ff003c] to-[#ff4d4d]">
                    {streak}
                  </span>
                  <span className="text-xl text-slate-500 font-bold mb-1">dias</span>
                </div>
                <p className="text-[10px] text-[#ff003c] font-mono mt-4 uppercase opacity-50">Clique para ver o calendário</p>
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center w-full z-10 h-full"
              >
                <h3 className="text-sm text-slate-400 font-mono uppercase tracking-widest mb-3">Semana Atual</h3>
                <div className="grid grid-cols-7 gap-2 w-full mx-auto max-w-[280px]">
                   {currentWeek.days.map((day) => (
                      <div key={day.dateKey} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">{day.label}</span>
                        <div
                          className={`w-full aspect-square rounded-xl border flex items-center justify-center text-[10px] font-bold ${
                            day.trained
                              ? 'bg-[#ff003c] border-[#ff003c]/50 text-white shadow-[0_0_8px_rgba(255,0,60,0.35)]'
                              : day.isWeekend && currentWeek.protectedWeekend
                              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                              : 'bg-[#162032] border-white/10 text-slate-500'
                          }`}
                        >
                          {day.trained ? 'OK' : day.isWeekend && currentWeek.protectedWeekend ? 'FREE' : '--'}
                        </div>
                      </div>
                   ))}
                </div>
                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                  {currentWeek.missedWeekdays === 0
                    ? 'Semana perfeita. O fim de semana fica protegido.'
                    : currentWeek.missedWeekdays === 1
                    ? currentWeek.compensationFulfilled
                      ? 'Um dia congelado e os dois dias do fim de semana pagos.'
                      : 'Um dia congelado. Treinar sábado e domingo mantém a semana viva.'
                    : `Penalidade ativa: -${currentWeek.penaltyDays} dias pelas faltas além da primeira.`}
                </p>
                <p className="text-[10px] text-[#ff003c] font-mono mt-auto pt-4 uppercase opacity-50">Toque para voltar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gradient-to-b from-[#162032] to-[#0a0e17] p-6 rounded-3xl border border-white/10 h-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <UserSquare className="w-5 h-5 text-[#1d4ed8]" />
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">Matriz Pessoal</h2>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                  Leitura geral das armas que Bernardo ja ativou
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {matrixHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-white/8 bg-black/20 px-3 py-2 text-right"
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="text-sm font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/5 bg-black/20 p-4 sm:p-6">
            <div className="h-[320px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="52%" outerRadius="74%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#1d4ed8', fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Ego" dataKey="A" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.24} strokeWidth={2.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action -> Training */}
      <Link 
        href="/training"
        className="group relative w-full bg-gradient-to-r from-[#0a0e17] via-[#162032] to-[#0a0e17] border border-[#1d4ed8]/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between overflow-hidden transition-all hover:border-[#1d4ed8] hover:shadow-[0_0_30px_rgba(29,78,216,0.2)]"
      >
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1d4ed8] box-shadow-neon" />
        <div className="flex items-center gap-6 z-10 w-full">
          <div className="w-16 h-16 rounded-full bg-[#1d4ed8]/10 border border-[#1d4ed8]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-8 h-8 text-[#1d4ed8]" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Treino Diário</h2>
            <p className="text-sm text-slate-400">Verifique o protocolo gerado pelo Ego e inicie os exercícios.</p>
          </div>
          <div className="hidden md:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center group-hover:bg-[#1d4ed8]/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-[#1d4ed8]" />
          </div>
        </div>
      </Link>

      <div className="w-full bg-[#0a0e17] rounded-3xl border border-white/5 box-shadow-neon p-6">
        <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1d4ed8]" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">Alertas Blue Lock</h2>
          </div>
          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
            <button
              onClick={() => void requestNotificationPermission()}
              className="rounded-full border border-[#1d4ed8]/30 bg-[#1d4ed8]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#60a5fa]"
            >
              Ativar
            </button>
          )}
        </div>

        {latestNotifications.length > 0 ? (
          <div className="space-y-3">
            {latestNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                  notification.readAt
                    ? 'border-white/5 bg-black/20'
                    : 'border-[#1d4ed8]/20 bg-[#162032]/70'
                }`}
              >
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#1d4ed8]">{notification.title}</p>
                <p className="mt-2 text-sm text-slate-300">{notification.body}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-5 text-sm text-slate-500">
            A Anri ainda está montando seus alertas do dia.
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
      
      {/* Historico de Treinos */}
      <div className="w-full bg-[#0a0e17] rounded-3xl border border-white/5 box-shadow-neon p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
           <History className="w-5 h-5 text-slate-400" />
           <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">Histórico de Treino</h2>
        </div>
        
        {history.length > 0 ? (
          <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
            {history.map((session: any) => (
              <div key={session.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-2xl bg-black border border-white/5 hover:border-[#1d4ed8]/30 transition-colors gap-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#162032] border border-white/10 flex items-center justify-center">
                     <Dumbbell className="w-5 h-5 text-[#1d4ed8]" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-mono">
                        {new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                     </p>
                     <p className="text-sm font-bold text-slate-200">{session.type}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 md:justify-end shrink-0">
                    <span className="text-sm font-black text-[#ff003c]">+{session.xpEarned} XP</span>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
             <p className="text-slate-500 text-sm font-mono tracking-widest uppercase">Nenhum treino completado ainda</p>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

      {/* Map Content injected below */}
      <div className="w-full p-0 m-0">
        <MapPage />
      </div>

      {isStreakInfoOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0e17] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#60a5fa]">Como a ofensiva conta</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Regra do streak</h3>
              </div>
              <button
                onClick={() => setIsStreakInfoOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-300">
              <p>1. Se Bernardo fecha os 5 dias úteis, sábado e domingo ficam livres e a semana vale 7 dias cheios.</p>
              <p>2. Se ele perde 1 dia útil, esse dia congela. Treinar nos 2 dias do fim de semana mantém a semana viva e rende 6 dias.</p>
              <p>3. Se ele perde 2 dias úteis ou mais, cada falta a partir da segunda tira 2 dias do streak até o total zerar.</p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Resumo da semana atual</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Dias úteis</p>
                  <p className="text-lg font-black text-white">{currentWeek.trainedWeekdays}/5</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Fim de semana</p>
                  <p className="text-lg font-black text-white">{currentWeek.trainedWeekendDays}/2</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Delta</p>
                  <p className="text-lg font-black text-white">{currentWeek.delta >= 0 ? `+${currentWeek.delta}` : currentWeek.delta}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
