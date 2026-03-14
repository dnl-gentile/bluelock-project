import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MOCK_DRILLS = [
  {
    id: 1,
    title: 'Aceleração de Resposta',
    emoji: '⚡️',
    type: 'velocidade',
    description: 'Corridas curtas de 10m focando na explosão dos três primeiros passos.',
    topics: [
      'Posição base agachada',
      'Corpo projetado para frente 45 graus',
      'Foco total no momento de disparo'
    ],
    videoUrl: 'placeholder'
  },
  {
    id: 2,
    title: 'Drible Fantasma (Tesoura)',
    emoji: '👻',
    type: 'drible',
    description: 'Foque na ginga do quadril para desequilibrar o oponente antes de tocar na bola.',
    topics: [
      'Passe a perna por cima da bola sem tocá-la',
      'Mude o peso do corpo (o "sell" do movimento)',
      'Exploda para a direção oposta'
    ],
    videoUrl: 'placeholder'
  },
  {
    id: 3,
    title: 'Finalização Seca (Ego)',
    emoji: '🔥',
    type: 'chute',
    description: 'Chute de peito de pé buscando o ângulo sem precisar ajeitar a bola.',
    topics: [
      'Pé de apoio firme ao lado da bola',
      'Corpo levemente inclinado sobre a bola',
      'Ponto de contato: osso do "cadarço" da chuteira'
    ],
    videoUrl: 'placeholder'
  }
];

export default function TrainingRoom() {
  const [expandedDrill, setExpandedDrill] = useState<number | null>(MOCK_DRILLS[0].id);
  const [chatInput, setChatInput] = useState('');
  const router = useRouter();

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto h-full">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase text-shadow-neon">
            Treino do Dia
          </h1>
          <p className="text-[#1d4ed8] font-mono text-sm capitalize">{todayStr}</p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 bg-[#0a0e17] px-4 py-2 rounded-xl border border-white/5">
          <Target className="w-4 h-4 text-[#ff003c]" />
          <span className="text-sm font-mono uppercase tracking-widest text-[#ff003c]">Foco: Explosão & Ataque</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drills List */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-slate-500 font-mono tracking-widest uppercase mb-2">Protocolo Gerado Automático</p>
          
          {MOCK_DRILLS.map((drill) => {
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
        <div className="space-y-6">
          <Link 
            href="/drill/1"
            className="w-full relative overflow-hidden group bg-gradient-to-br from-[#ff003c] to-[#990024] p-6 rounded-3xl flex flex-col items-center justify-center border border-[#ff003c]/50 hover:shadow-[0_0_40px_rgba(255,0,60,0.4)] transition-all cursor-pointer block text-center"
          >
            <div className="absolute inset-0 bg-[#1d4ed8] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
            <Play className="w-16 h-16 text-white mb-2 fill-white" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              INICIAR PROTOCOLO
            </h2>
            <p className="text-white/70 text-sm mt-1">Tempo Est.: 15 min</p>
          </Link>

          <div className="bg-[#0a0e17] rounded-3xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4 text-[#1d4ed8]">
              <ClipboardList className="w-5 h-5" />
              <h3 className="text-sm font-mono tracking-widest uppercase font-bold">Ajuste de Treino (Ego)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Anri está processando seus dados para o Ego. Deseja focar em outro fundamento hoje ou encontrou alguma dor muscular?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: Quero drible..."
                className="w-full sm:flex-1 bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#1d4ed8] font-mono text-sm"
              />
              <button 
                className="shrink-0 bg-[#162032] border border-white/10 hover:border-[#1d4ed8]/50 text-white rounded-xl px-4 py-2 sm:py-0 text-xs font-bold uppercase transition-colors"
                onClick={() => {
                  if (chatInput.trim()) {
                    router.push(`/chat?q=${encodeURIComponent(chatInput)}`);
                  } else {
                    router.push('/chat');
                  }
                }}
              >
                Refatorar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
