import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Flame, Wind, Eye, Brain, Activity, Target, X } from 'lucide-react';
import { useEgoStore, type SkillType } from '../store/useEgoStore';

const SKILL_POSITIONS: Record<string, {x: number, y: number}> = {
  // Chute x: 400
  'c1': { x: 400, y: 600 },
  'c2': { x: 400, y: 900 },
  'c3': { x: 400, y: 1200 },
  'c4': { x: 400, y: 1500 },
  'c5': { x: 400, y: 1800 },
  
  // Velocidade x: 750
  'v1': { x: 750, y: 600 },
  'v2': { x: 750, y: 900 },
  'v3': { x: 750, y: 1200 },
  'v4': { x: 750, y: 1500 },
  'v5': { x: 750, y: 1800 },
  
  // Drible x: 1100
  'd1': { x: 1100, y: 600 },
  'd2': { x: 1100, y: 900 },
  'd3': { x: 1100, y: 1200 },
  'd4': { x: 1100, y: 1500 },
  'd5': { x: 1100, y: 1800 },
  
  // Mentalidade x: 1450
  'm1': { x: 1450, y: 600 },
  'm2': { x: 1450, y: 900 },
  'm3': { x: 1450, y: 1200 },
  'm4': { x: 1450, y: 1500 },
  'm5': { x: 1450, y: 1800 },
  
  // Passe x: 1800
  'p1': { x: 1800, y: 600 },
  'p2': { x: 1800, y: 900 },
  'p3': { x: 1800, y: 1200 },
  'p4': { x: 1800, y: 1500 },
  
  // Resistencia x: 2150
  'r1': { x: 2150, y: 600 },
  'r2': { x: 2150, y: 900 },
  'r3': { x: 2150, y: 1200 },
  'r4': { x: 2150, y: 1500 },
};

const CENTER_X = 1275;
const START_Y = 260;
const EGO_CENTER = { x: CENTER_X, y: START_Y };

const getPos = (id: string) => {
  const p = SKILL_POSITIONS[id];
  if (!p) return EGO_CENTER;
  return p;
};

const COLUMNS = [
  { id: 'chute', label: 'Chute / Finalização', color: 'rgba(255,0,60,1)', x: 400 },
  { id: 'velocidade', label: 'Velocidade', color: 'rgba(29,78,216,1)', x: 750 },
  { id: 'drible', label: 'Drible & Agilidade', color: 'rgba(59,130,246,1)', x: 1100 },
  { id: 'mentalidade', label: 'Cérebro / Visão', color: 'rgba(192,132,252,1)', x: 1450 },
  { id: 'passe', label: 'Passe & Tabelas', color: 'rgba(245,158,11,1)', x: 1800 },
  { id: 'resistencia', label: 'Resistência Física', color: 'rgba(16,185,129,1)', x: 2150 },
];

const RANKS = [
  { id: 'Z', label: 'Tier 1 - Fundamentos', y: 600 },
  { id: 'Y', label: 'Tier 2 - Treinamento Base', y: 900 },
  { id: 'X', label: 'Tier 3 - Especialização', y: 1200 },
  { id: 'W', label: 'Tier 4 - Arma Suprema', y: 1500 },
  { id: 'V', label: 'Tier 5 - Nível Mundial', y: 1800 },
];

export default function SkillsRoom() {
  const { skills, xp } = useEgoStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(1000);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getIcon = (type: SkillType, className: string = '') => {
    switch(type) {
      case 'chute': return <Flame className={className} />;
      case 'velocidade': return <Wind className={className} />;
      case 'drible': return <Eye className={className} />;
      case 'mentalidade': return <Brain className={className} />;
      case 'resistencia': return <Activity className={className} />;
      case 'passe': return <Target className={className} />;
      default: return <Eye className={className} />;
    }
  };

  const getTypeColor = (type: SkillType) => {
    switch(type) {
      case 'chute': return 'text-[#ff003c] border-[#ff003c]/30';
      case 'velocidade': return 'text-[#1d4ed8] border-[#1d4ed8]/30';
      case 'drible': return 'text-[#3b82f6] border-[#3b82f6]/30';
      case 'mentalidade': return 'text-[#c084fc] border-[#c084fc]/30';
      case 'resistencia': return 'text-[#10b981] border-[#10b981]/30';
      case 'passe': return 'text-[#f59e0b] border-[#f59e0b]/30';
      default: return 'text-white border-white/30';
    }
  };

  return (
    <div className="w-full flex-1 relative bg-[#050505] overflow-hidden">
      {/* UI Overlay */}
      <div className="absolute inset-x-0 top-4 z-50 px-4 pointer-events-none md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <h1 className="max-w-[8ch] text-[1.9rem] leading-[0.92] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] uppercase tracking-tight text-shadow-neon">
              Árvore do Ego
            </h1>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/5 bg-[#0a0e17]/88 px-3 py-2 shadow-2xl backdrop-blur-md box-shadow-neon">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 font-mono tracking-[0.24em] uppercase mb-1">XP Disponível</span>
              <span className="text-[1.75rem] leading-none font-black text-[#1d4ed8] drop-shadow-[0_0_15px_rgba(29,78,216,0.8)]">{xp} XP</span>
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-[14.5rem] rounded-lg bg-black/45 px-2.5 py-2 text-[11px] leading-tight text-slate-400 backdrop-blur">
          Arraste a teia livremente pelas zonas. As linhas horizontais representam o avanço de Rank.
        </p>
      </div>

      <div className="absolute top-6 left-6 z-50 hidden md:block pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] pt-4 max-w-sm">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] uppercase tracking-tighter text-shadow-neon">
          Árvore do Ego
        </h1>
        <p className="text-slate-400 font-medium text-xs md:text-sm mt-1 bg-black/40 p-2 rounded backdrop-blur">
           Arraste a teia livremente pelas zonas. As linhas horizontais representam o avanço de Rank.
        </p>
      </div>
      
      <div className="absolute top-6 right-6 z-50 hidden md:block pointer-events-none pt-4">
        <div className="flex flex-col items-end px-4 bg-[#0a0e17]/80 backdrop-blur-md py-3 rounded-2xl border border-white/5 box-shadow-neon pointer-events-auto shadow-2xl">
           <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">XP Disponível</span>
           <span className="text-2xl font-black text-[#1d4ed8] drop-shadow-[0_0_15px_rgba(29,78,216,0.8)]">{xp} XP</span>
        </div>
      </div>

      {/* Draggable Area Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-0 bg-transparent outline-none border-none overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <motion.div 
          drag 
          dragConstraints={containerRef}
          initial={{ x: -1275 + windowWidth / 2, y: 40 }}
          className="absolute top-0 left-0 w-[2600px] h-[2100px]"
        >
          {/* Background Gradient Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(29,78,216,0.05)_0%,_rgba(0,0,0,0)_60%)] pointer-events-none" />

          {/* Rank Horizontal Rows mapping */}
          {RANKS.map((rank, i) => (
             <div key={rank.id} className="absolute w-full pointer-events-none" style={{ top: rank.y - 150, height: 300 }}>
                {/* Visual horizontal separator line for the row */}
                <div className="absolute w-[2600px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent top-0" />
                
                {/* Label of Rank Row repeated to be visible across panning */}
                {[50, 1000, 2000].map((xPos, idx) => (
                   <div key={xPos} className={`absolute top-2 font-black font-mono tracking-[0.5em] text-4xl uppercase select-none transition-opacity ${idx === 0 ? 'text-white/50 opacity-30' : 'text-white/30 opacity-10'}`} style={{ left: xPos }}>
                      RANK {rank.id}
                      <span className="block text-sm tracking-widest font-sans font-medium mt-1">{rank.label}</span>
                   </div>
                ))}
                
                {/* Alternate subtle background row banding */}
                <div className={`absolute inset-0 w-[2600px] ${i % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}`} />
             </div>
          ))}

          {/* Grouping Columns Background */}
          {COLUMNS.map(col => (
             <div 
                key={col.id} 
                className="absolute top-0 h-full pointer-events-none flex flex-col items-center" 
                style={{ left: col.x - 175, width: 350 }}
             >
                <div 
                   className="absolute inset-0 opacity-10" 
                   style={{ 
                      background: `linear-gradient(to bottom, transparent 10%, ${col.color.replace(',1)', ',0.8)')} 50%, transparent 90%)`,
                   }}
                />
                
                {/* Subtle boundary border */}
                <div className="absolute inset-y-0 left-0 w-px bg-white/5" />
                <div className="absolute inset-y-0 right-0 w-px bg-white/5" />
                
                <div className="mt-[380px] px-4 py-2 z-0 flex flex-col items-center">
                   <h2 className="font-black tracking-[0.2em] uppercase font-sans text-xl whitespace-nowrap" style={{ color: col.color.replace(',1)', ',0.9)') }}>
                      {col.label}
                   </h2>
                   <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase mt-1 text-center">Fundamento Base</span>
                </div>
             </div>
          ))}

          {/* SVG paths (Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
             {/* EGO paths to tier 1 */}
             {skills.filter(s => s.tier === 1).map(skill => {
                const end = getPos(skill.id);
                const isUnlocked = skill.unlocked;
                return (
                  <path 
                    key={`ego-${skill.id}`} 
                    d={`M ${EGO_CENTER.x} ${EGO_CENTER.y} C ${EGO_CENTER.x} ${(EGO_CENTER.y + end.y)/2 + 50}, ${end.x} ${(EGO_CENTER.y + end.y)/2 - 50}, ${end.x} ${end.y}`} 
                    stroke={isUnlocked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"} 
                    strokeWidth="3" 
                    fill="none" 
                    strokeDasharray="5 5"
                  />
                );
             })}
             
             {/* Dependency paths for tier 2/3/4/5 */}
             {skills.map(skill => {
                const end = getPos(skill.id);
                const isUnlocked = skill.unlocked;
                return skill.dependencies.map(depId => {
                   const start = getPos(depId);
                   const startSkill = skills.find(s => s.id === depId);
                   const isDepUnlocked = startSkill?.unlocked;
                   
                   const color = isUnlocked 
                      ? '#1d4ed8' 
                      : (isDepUnlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)');
                   
                   return (
                     <path 
                       key={`${depId}-${skill.id}`} 
                       d={`M ${start.x} ${start.y} C ${start.x} ${start.y + (end.y - start.y)/2}, ${end.x} ${end.y - (end.y - start.y)/2}, ${end.x} ${end.y}`}
                       stroke={color} 
                       strokeWidth={isUnlocked ? "4" : "2"} 
                       fill="none" 
                     />
                   )
                });
             })}
          </svg>

          {/* Root EGO Node */}
          <div 
             className="absolute pointer-events-none"
             style={{ left: EGO_CENTER.x, top: EGO_CENTER.y, transform: 'translate(-50%, -50%)', zIndex: 10 }}
          >
             <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#0a0e17] to-black border-4 border-[#1d4ed8] flex items-center justify-center shadow-[0_0_50px_rgba(29,78,216,0.6)]">
                   <Brain className="w-12 h-12 text-[#1d4ed8] animate-pulse-neon" />
                </div>
                <div className="absolute bottom-full mb-6 flex flex-col items-center bg-black/90 backdrop-blur px-8 py-3 rounded-2xl border border-white/10 shadow-xl w-max">
                   <h2 className="text-xl md:text-2xl font-black text-[#1d4ed8] uppercase tracking-[0.2em] mb-1">Ego Original</h2>
                   <p className="text-[10px] text-slate-400 font-mono tracking-[0.3em] uppercase">Raiz da Evolução</p>
                </div>
             </div>
          </div>

          {/* Skill Nodes */}
          {skills.map(skill => {
            const pos = getPos(skill.id);
            const isUnlocked = skill.unlocked;
            const canUnlock = !isUnlocked && xp >= skill.requiredXp && skill.dependencies.every(d => skills.find(s => s.id === d)?.unlocked);
            const isExpanded = expandedId === skill.id;
            const colorScheme = getTypeColor(skill.type);

            return (
              <div 
                key={skill.id}
                className="absolute"
                style={{ 
                  left: pos.x, top: pos.y, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: isExpanded ? 50 : 20 
                }}
              >
                <motion.div
                  layout
                  onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                  className={`relative flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
                    ${isUnlocked ? 'bg-[#162032] border ' + colorScheme.split(' ')[1] : canUnlock ? 'bg-black border border-[#1d4ed8]/50 shadow-[0_0_20px_rgba(29,78,216,0.2)]' : 'bg-black border border-white/5 grayscale opacity-50'}
                  `}
                  style={{
                    width: isExpanded ? 240 : 64,
                    height: isExpanded ? 'auto' : 64,
                    minHeight: isExpanded ? 140 : 64,
                    boxShadow: isUnlocked ? `0 0 15px ${colorScheme.split(' ')[1].replace('/30)', ')').replace('border-', '')}` : undefined
                  }}
                >
                  {/* Collapsed View (Icon only) */}
                  <motion.div layout="position" className={`p-4 ${isExpanded ? 'pb-2' : ''}`}>
                    {getIcon(skill.type, `w-6 h-6 ${isUnlocked ? colorScheme.split(' ')[0] : 'text-slate-400'}`)}
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 pb-4 flex flex-col items-center w-full mt-2"
                      >
                        <h3 className={`text-sm font-black text-center mb-1 uppercase ${isUnlocked ? 'text-white' : 'text-slate-200'}`}>
                          {skill.name}
                        </h3>
                        <p className="text-[10px] text-center text-slate-400 mb-4 leading-snug font-medium">
                          {skill.description}
                        </p>
                        
                        <div className="mt-auto w-full pt-3 border-t border-white/10 flex justify-between items-center">
                           <div className="flex gap-1 items-center bg-black/60 px-2 py-1.5 rounded-md border border-white/5">
                             {isUnlocked ? <Unlock className="w-3 h-3 text-[#1d4ed8]" /> : <Lock className="w-3 h-3 text-slate-500" />}
                             <span className="text-[10px] font-bold text-slate-300">{skill.requiredXp} XP</span>
                           </div>
                           
                           {!isUnlocked && canUnlock && (
                             <span className="text-[9px] bg-[#1d4ed8]/20 text-[#1d4ed8] border border-[#1d4ed8]/30 px-2 py-1 rounded font-bold uppercase animate-pulse">
                               Disponível
                             </span>
                           )}
                           {!isUnlocked && !canUnlock && (
                             <span className="text-[9px] bg-red-500/10 text-red-500/50 border border-red-500/20 px-2 py-1 rounded font-bold uppercase">
                               Bloqueado
                             </span>
                           )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isExpanded && (
                    <button 
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
                
                {/* Node Label underneath when collapsed */}
                <AnimatePresence>
                   {!isExpanded && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute pt-1 w-32 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{skill.name}</span>
                     </motion.div>
                   )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>

    </div>
  );
}
