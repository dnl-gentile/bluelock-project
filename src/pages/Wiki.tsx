import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, Brain, Footprints, ChevronDown, Bot, Play, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'chute', label: 'Chute', icon: Target, color: '#ff003c' },
  { id: 'velocidade', label: 'Velocidade', icon: Activity, color: '#1d4ed8' },
  { id: 'drible', label: 'Drible', icon: Footprints, color: '#3b82f6' },
  { id: 'tática', label: 'Tática/Visão', icon: Brain, color: '#c084fc' },
  { id: 'passe', label: 'Passe', icon: Target, color: '#f59e0b' },
  { id: 'resistencia', label: 'Resistência', icon: Activity, color: '#10b981' },
];

const MOCK_WIKI_ENTRIES = {
  chute: [
    { title: 'Chute de Peito de Pé (Laces)', text: 'O chute mais potente. Você atinge a bola com o osso rígido na parte superior do pé (onde ficam os cadarços). É ideal para finalizações de média e longa distância.', drillId: 3 },
    { title: 'Chute Direto (Volley)', text: 'Pegar a bola no ar antes que ela caia. Exige tempo de bola, os olhos não podem desgrudar dela. Incline o corpo por cima do chute para manter a bola baixa.', drillId: null },
  ],
  drible: [
    { title: 'Drible Fantasma (Tesoura)', text: 'Passe o pé por cima da bola, de dentro para fora, ameaçando ir para um lado. Com o outro pé, empurre a bola para o lado oposto e acelere.', drillId: 2 },
    { title: 'Drible da Vaca / Meia Lua', text: 'Tocar a bola por um lado do oponente e correr pelo outro lado. Exige que o oponente esteja desatento ou muito pesado nos calcanhares.', drillId: null },
  ],
  tática: [
    { title: 'Metavisão', text: 'Escaneamento constante. Antes de receber a bola, olhe por cima dos ombros. Desenhe um mapa do campo na sua cabeça: onde estão seus aliados e os inimigos.', drillId: null },
    { title: 'Isolamento (1v1)', text: 'Arraste o defensor para uma área do campo onde não há cobertura zagueiros.', drillId: null }
  ],
  velocidade: [
    { title: 'Aceleração de Resposta', text: 'Corridas curtas de 10m focando na explosão dos três primeiros passos. Corpo projetado à frente.', drillId: 1 }
  ],
  passe: [
    { title: 'Passe Fatiado (Trivela Cruzada)', text: 'Bater na bola com os 3 dedos de fora arrastando lateralmente contra a grama. Faz com que a bola assuma o trajeto curvilíneo que desvia da barreira de bloqueio antes de voltar fatalmente para a linha de chute do atacante.', drillId: null }
  ],
  resistencia: [
    { title: 'Descanso Celular Ativo', text: 'Treinamento sobre como caminhar e regular o ritmo de exalação e inalação nasal nos milissegundos mortos em que o juiz assopra o apito ou a bola cruza a linha lateral.', drillId: null }
  ]
};

export default function Wiki() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chute');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const activeEntries = MOCK_WIKI_ENTRIES[activeTab as keyof typeof MOCK_WIKI_ENTRIES] || [];

  return (
    <div className="flex flex-col space-y-8 max-w-5xl mx-auto py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] to-[#1d4ed8] uppercase tracking-tighter text-shadow-neon">
          Bluelockpedia
        </h1>
        <p className="text-slate-400 font-medium">Bíblia do Egoísta. Descubra e pesquise sobre futebol.</p>
      </div>

      <div className="w-full">
        {/* Wiki Content Panel */}
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-[#162032] rounded-2xl overflow-x-auto no-scrollbar border border-white/5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap flex-1 justify-center ${
                    isActive ? 'bg-[#050505] border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent'
                  }`}
                  style={{ color: isActive ? cat.color : '#64748b' }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-widest uppercase font-display">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {activeEntries.map((entry, idx) => {
                  const isExpanded = expandedEntry === entry.title;
                  const ringColor = CATEGORIES.find(c => c.id === activeTab)?.color || '#fff';
                  
                  return (
                    <div key={idx} className="bg-[#0a0e17] rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-white/20">
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.title)}
                        className="w-full px-6 py-4 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <BookOpen className="w-5 h-5 opacity-50" style={{ color: ringColor }} />
                          <h3 className="text-white font-bold text-base md:text-lg text-left">{entry.title}</h3>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180 text-white' : 'text-slate-600'}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="px-6 pb-6 pt-2">
                              <div className="w-full h-px bg-white/5 mb-4" />
                              <p className="text-slate-300 leading-relaxed text-sm mb-4">
                                {entry.text}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/5 text-slate-400">Teoria</span>
                                  {entry.drillId && <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[#1d4ed8]/20 text-[#1d4ed8]">Prática Disp.</span>}
                                </div>
                                {entry.drillId && (
                                  <Link to={`/drill/${entry.drillId}`} className="flex items-center gap-2 bg-[#ff003c] px-4 py-2 rounded-xl text-white hover:brightness-110 transition-all font-bold text-xs uppercase">
                                    <Play className="w-3 h-3 fill-white" /> Treinar
                                  </Link>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* AI Creation Bot Component Moved to Bottom */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-slate-400 font-mono text-xs uppercase mb-3 text-center">Precisa aprofundar um conceito? Solicite a inclusão.</p>
            <button onClick={() => navigate('/chat?q=Quero adiconar uma entrada no Wiki')} className="w-full max-w-lg mx-auto bg-[#162032] border border-[#1d4ed8]/30 hover:border-[#1d4ed8] rounded-2xl p-4 flex items-center justify-center gap-3 transition-colors box-shadow-neon">
              <Bot className="w-6 h-6 text-[#1d4ed8]" />
              <div className="text-left">
                <span className="block font-bold text-sm tracking-widest text-white uppercase">Criar via Blue Lockman (IA)</span>
                <span className="block text-xs text-slate-400">Pede para a IA gerar uma nova técnica na Bluelockpedia.</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
