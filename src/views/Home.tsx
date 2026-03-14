import { useEffect, useState } from 'react';
import { CloudRain, Sun, Zap, Flame, Calendar, ChevronRight, UserSquare, ArrowRightLeft, History, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { differenceInDays, isYesterday, isToday } from 'date-fns';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEgoStore } from '../store/useEgoStore';
import MapPage from './MapPage';

const QUOTES = [
  "O talento é algo que você faz florescer, o instinto é algo que você poli. - Blue Lock",
  "Eu não sou perfeccionista, sou apenas exigente comigo mesmo. - Cristiano Ronaldo",
  "Seu 'Ego' é a única bússola confiável neste campo.",
  "Para ser o melhor, você deve acreditar que é o melhor.",
  "A verdadeira química ocorre quando dois Egos se chocam e se devoram."
];

interface WeatherData {
  temp: number;
  condition: 'Rain' | 'Clear' | 'Clouds' | unknown;
  description: string;
}

export default function Home() {
  const { profile } = useAuth();
  const { history, xp, rank } = useEgoStore();
  
  const [quote, setQuote] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [streak, setStreak] = useState(0);
  const [viewMode, setViewMode] = useState<'streak' | 'calendar'>('streak');

  const calculateRadarData = () => {
    const base = Math.min(100, (xp / 10000) * 100);
    return [
      { subject: 'Vel', A: Math.min(100, base + 20), fullMark: 100 },
      { subject: 'Res', A: Math.min(100, base + 10), fullMark: 100 },
      { subject: 'Chute', A: Math.min(100, base + 40), fullMark: 100 },
      { subject: 'Drible', A: Math.min(100, base + 30), fullMark: 100 },
      { subject: 'Passe', A: Math.min(100, base + 5), fullMark: 100 },
      { subject: 'Mente', A: Math.min(100, base + 15), fullMark: 100 },
    ];
  };

  const radarData = calculateRadarData();

  useEffect(() => {
    // Random Quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Calculate Streak
    if (history.length > 0) {
      const dates = history.map((h: any) => new Date(h.date)).sort((a: any, b: any) => b.getTime() - a.getTime());
      
      let currentStreak = 0;
      let lastDate = new Date(); // Start checking from today
      
      // If the latest training was neither today nor yesterday, streak is broken.
      if (!isToday(dates[0]) && !isYesterday(dates[0])) {
        currentStreak = 0;
      } else {
        // Calculate consecutive days backwards
        for (let i = 0; i < dates.length; i++) {
          const diff = differenceInDays(lastDate, dates[i]);
          if (diff === 0 && i > 0) continue; // Same day multiple trainings, ignore
          if (diff <= 1) {
            currentStreak++;
            lastDate = dates[i];
          } else {
            break;
          }
        }
      }
      setStreak(currentStreak);
    }

    // Fetch Weather (Fake API call to openweathermap for demonstration, assuming user will add key)
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (!apiKey) {
          // Mock data if no key is provided
          setWeather({ temp: 28, condition: 'Clear', description: 'Céu aberto, ideal para outdoor' });
          return;
        }

        // Real fetching for Aracaju
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Aracaju,BR&units=metric&appid=${apiKey}`);
        const data = await res.json();
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          description: data.weather[0].description
        });
      } catch (err) {
        setWeather({ temp: 30, condition: 'Clear', description: 'Clima não detectado' });
      }
    };

    fetchWeather();
  }, [history]);

  const isIndoorProtocol = weather?.condition === 'Rain';

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
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Clima Aracaju</p>
              <p className="text-white font-bold">{weather.temp}°C - {isIndoorProtocol ? 'INDOOR REC.' : 'OUTDOOR'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Center Layout For Widget And Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Motivational Quote & Streak Row */}
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-[#162032] to-[#0a0e17] p-6 rounded-3xl border border-[#1d4ed8]/20 relative overflow-hidden flex flex-col justify-center flex-1">
            <Zap className="absolute top-4 right-4 w-24 h-24 text-[#1d4ed8] opacity-5 -rotate-12" />
            <h3 className="text-xs text-[#1d4ed8] font-mono tracking-widest uppercase mb-2">Mensagem do Dia</h3>
            <p className="text-lg md:text-xl font-medium text-white max-w-[90%] italic">
              "{quote}"
            </p>
          </div>

          <div 
            className="bg-[#050505] p-6 rounded-3xl border border-[#ff003c]/30 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-colors hover:border-[#ff003c]/70 min-h-[220px]"
            onClick={() => setViewMode(viewMode === 'streak' ? 'calendar' : 'streak')}
          >
            <div className={`absolute inset-0 bg-gradient-to-b from-[#ff003c]/20 to-transparent transition-opacity ${viewMode === 'streak' ? 'opacity-20' : 'opacity-10'}`} />
            
            <button className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full z-10">
               <ArrowRightLeft className="w-4 h-4" />
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
                  <h3 className="text-sm text-slate-400 font-mono uppercase tracking-widest mb-3">Registro de Março</h3>
                  <div className="grid grid-cols-7 gap-1.5 w-full mx-auto max-w-[200px]">
                     {/* simple mock calendar grid */}
                     {Array.from({length: 28}).map((_, i) => {
                        // fake trained days
                        const isTrainedDay = i === 11 || i === 12 || i === 13;
                        const isFuture = i > 15;
                        return (
                          <div 
                             key={i} 
                             className={`w-full aspect-square rounded-sm border ${
                               isFuture ? 'border-white/5 bg-transparent' 
                               : (isTrainedDay ? 'bg-[#ff003c] border-[#ff003c]/50 shadow-[0_0_5px_#ff003c]' : 'bg-[#162032] border-white/10')
                             }`}
                          />
                        )
                     })}
                  </div>
                  <p className="text-[10px] text-[#ff003c] font-mono mt-auto pt-4 uppercase opacity-50">Toque para voltar</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Radar Chart Panel */}
        <div className="bg-gradient-to-b from-[#162032] to-[#0a0e17] p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-start h-[350px]">
          <div className="flex items-center gap-2 mb-2 w-full">
            <UserSquare className="w-5 h-5 text-[#1d4ed8]" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">Matriz Pessoal</h2>
          </div>
          
          <div className="w-full flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#1d4ed8', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Ego" dataKey="A" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full flex justify-between px-4 mt-2">
            <span className="text-xs font-mono text-slate-500 uppercase">Classificação</span>
            <span className="text-sm font-bold text-[#1d4ed8]">RANK {rank}</span>
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
            <p className="text-sm text-slate-400">Verifique o protocolo gerado pela IA e inicie os exercícios.</p>
          </div>
          <div className="hidden md:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center group-hover:bg-[#1d4ed8]/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-[#1d4ed8]" />
          </div>
        </div>
      </Link>

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

    </div>
  );
}
