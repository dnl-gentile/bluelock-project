import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RotateCcw, Swords, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEgoStore } from '../store/useEgoStore';

type DrillPhase = 'PREVIEW' | 'COUNTDOWN' | 'ACTIVE' | 'FINISHED';

// Fake drill data for demonstration
const DRILL_MOCK = {
  id: '1',
  title: 'Aceleração de Resposta',
  description: 'Corridas curtas de 10m focando na explosão dos três primeiros passos.',
  durationSeconds: 120, // 2 minutes
  hasVideo: false,
  topic1: 'Posição base agachada',
  topic2: 'Foco total no momento de disparo'
};

export default function ActiveDrill() {
  const router = useRouter();
  const { completeTraining } = useEgoStore();
  
  const [phase, setPhase] = useState<DrillPhase>('PREVIEW');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DRILL_MOCK.durationSeconds);

  // Countdown Logic (3..2..1)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setPhase('ACTIVE');
      }
    }
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Active Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'ACTIVE') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      } else {
        finishDrill();
      }
    }
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const playWhistle = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (delay: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + delay + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + delay + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + delay + 0.3);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.3);
      };

      playBeep(0);
      playBeep(0.4);
    } catch (e) {
      console.warn("Audio not supported or permitted", e);
    }
  };

  const finishDrill = () => {
    setPhase('FINISHED');
    fireConfetti();
    playWhistle();
    
    // Save to history and grant XP
    completeTraining({
      type: DRILL_MOCK.title,
      xpEarned: 350
    });
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#1d4ed8', '#ff003c']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#1d4ed8', '#ff003c']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[600px] w-full max-w-lg mx-auto bg-[#050505] rounded-3xl border border-white/10 relative overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-bold font-mono tracking-widest text-sm uppercase opacity-50">Protocolo Ativo</h2>
        <h1 className="text-2xl font-black text-[#1d4ed8] uppercase tracking-tighter text-shadow-neon">{DRILL_MOCK.title}</h1>
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: PREVIEW (Video or Text Fallback) */}
        {phase === 'PREVIEW' && (
          <motion.div 
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 space-y-8"
          >
            {DRILL_MOCK.hasVideo ? (
              <div className="w-full aspect-[9/16] bg-[#162032] rounded-2xl border border-white/10 flex items-center justify-center">
                <span className="text-slate-500 font-mono">Vídeo Vertical em Iframe</span>
              </div>
            ) : (
              <div className="w-full bg-[#162032] p-8 rounded-3xl border border-[#ff003c]/30 flex flex-col items-center text-center space-y-6 box-shadow-neon">
                <Swords className="w-16 h-16 text-[#ff003c] animate-pulse-neon" />
                <p className="text-xl text-white font-medium">"{DRILL_MOCK.description}"</p>
                <div className="w-full space-y-3 pt-4 border-t border-white/10 text-left">
                  <div className="bg-[#0a0e17] px-4 py-3 rounded-xl border border-white/5">
                    <span className="text-[#1d4ed8] font-bold mr-2">1.</span>
                    <span className="text-slate-300">{DRILL_MOCK.topic1}</span>
                  </div>
                  <div className="bg-[#0a0e17] px-4 py-3 rounded-xl border border-white/5">
                    <span className="text-[#1d4ed8] font-bold mr-2">2.</span>
                    <span className="text-slate-300">{DRILL_MOCK.topic2}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full gap-4">
              <button 
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-4 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-5 h-5" /> Rever
              </button>
              <button 
                onClick={() => setPhase('COUNTDOWN')}
                className="flex-[2] bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-black rounded-2xl py-4 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 box-shadow-neon"
              >
                <Check className="w-6 h-6" /> Entendi
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: COUNTDOWN */}
        {phase === 'COUNTDOWN' && (
          <motion.div 
            key="countdown"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center relative z-10"
          >
            <motion.span 
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ff003c] to-[#ff4d4d] text-shadow-neon"
            >
              {countdown > 0 ? countdown : 'GO'}
            </motion.span>
          </motion.div>
        )}

        {/* PHASE 3: ACTIVE TIMER */}
        {phase === 'ACTIVE' && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-8"
          >
            {/* Visual Progress Ring Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <div className="w-64 h-64 rounded-full border-[10px] border-[#1d4ed8] animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <div className="text-7xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(29,78,216,0.8)] z-10">
              {formatTime(timeLeft)}
            </div>
            
            <p className="mt-8 text-slate-400 font-mono text-center uppercase tracking-widest z-10 max-w-[200px]">
              Foque no movimento. Não pare de respirar.
            </p>

            {/* Debug Force Finish */}
            <button 
              onClick={() => finishDrill()}
              className="mt-12 text-xs bg-white/5 px-4 py-2 rounded-full text-slate-500 hover:text-white"
            >
              (Dev) Pular Tempo
            </button>
          </motion.div>
        )}

        {/* PHASE 4: FINISHED */}
        {phase === 'FINISHED' && (
          <motion.div 
            key="finish"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center relative z-10 space-y-8 p-6"
          >
            <div className="w-32 h-32 rounded-full bg-[#1d4ed8]/10 border-4 border-[#1d4ed8] flex items-center justify-center box-shadow-neon">
              <Flag className="w-16 h-16 text-[#1d4ed8]" />
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Protocolo Concluído</h2>
              <p className="text-[#1d4ed8] font-mono">+350 XP Absorvidos</p>
            </div>

            <button 
              onClick={() => router.push('/training')}
              className="w-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-black rounded-2xl py-4 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 box-shadow-neon"
            >
              Continuar
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
