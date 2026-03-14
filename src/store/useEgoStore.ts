import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Rank = 'Z' | 'Y' | 'X' | 'W' | 'V' | 'U' | 'A' | 'S';
export type SkillType = 'chute' | 'drible' | 'velocidade' | 'mentalidade' | 'passe' | 'resistencia';

export interface Skill {
  id: string;
  name: string;
  description: string;
  requiredXp: number;
  unlocked: boolean;
  type: SkillType;
  dependencies: string[]; // IDs of required skills
  tier: number; // 1 (base), 2, 3 (advanced), 4, 5
}

export interface TrainingSession {
  id: string;
  date: string;
  type: string;
  xpEarned: number;
}

interface EgoState {
  xp: number;
  rank: Rank;
  skills: Skill[];
  history: TrainingSession[];
  
  addXp: (amount: number) => void;
  completeTraining: (session: Omit<TrainingSession, 'id' | 'date'>) => void;
  checkUnlocks: () => void;
  resetProgress: () => void;
}

const INITIAL_SKILLS: Skill[] = [
  // Chute Branch
  { id: 'c1', name: 'Domínio Básico', description: 'O primeiro passo para despertar seu Ego.', requiredXp: 0, unlocked: true, type: 'chute', dependencies: [], tier: 1 },
  { id: 'c2', name: 'Chute de Peito de Pé', description: 'Finalização firme com o osso do pé.', requiredXp: 500, unlocked: false, type: 'chute', dependencies: ['c1'], tier: 2 },
  { id: 'c3', name: 'Chute Direto (Ego)', description: 'Finalização perfeita de primeira.', requiredXp: 2500, unlocked: false, type: 'chute', dependencies: ['c2'], tier: 3 },
  { id: 'c4', name: 'Trivela Letal', description: 'Chute com curva externa violenta para fugir do goleiro.', requiredXp: 6000, unlocked: false, type: 'chute', dependencies: ['c3', 'p2'], tier: 4 },
  { id: 'c5', name: 'Predador (Olhar Sniper)', description: 'Precisão milimétrica, visando pontos cegos do goleiro a enorme distância.', requiredXp: 12000, unlocked: false, type: 'chute', dependencies: ['c4'], tier: 5 },
  
  // Velocidade Branch
  { id: 'v1', name: 'Corrida Estável', description: 'Fundamentos de biomecânica.', requiredXp: 0, unlocked: true, type: 'velocidade', dependencies: [], tier: 1 },
  { id: 'v2', name: 'Aceleração Explosiva', description: 'Ganhe velocidade no primeiro passo.', requiredXp: 800, unlocked: false, type: 'velocidade', dependencies: ['v1'], tier: 2 },
  { id: 'v3', name: 'Corrida sem Bola', description: 'Desmarque-se com passos em ponto cego.', requiredXp: 3000, unlocked: false, type: 'velocidade', dependencies: ['v2'], tier: 3 },
  { id: 'v4', name: 'Zona de Fluxo Máximo', description: 'Manutenção de aceleração inumana superior a 35km/h na ponta.', requiredXp: 7000, unlocked: false, type: 'velocidade', dependencies: ['v3', 'r2'], tier: 4 },
  { id: 'v5', name: 'Velocidade Divina', description: 'Arranque imbatível, impossível de ser acompanhado a olho nu.', requiredXp: 15000, unlocked: false, type: 'velocidade', dependencies: ['v4'], tier: 5 },
  
  // Drible Branch
  { id: 'd1', name: 'Controle Curto', description: 'Manter a bola próxima ao pé no trote.', requiredXp: 0, unlocked: true, type: 'drible', dependencies: [], tier: 1 },
  { id: 'd2', name: 'Ginga de Corpo', description: 'Desequilibrar oponente sem tocar na bola.', requiredXp: 1200, unlocked: false, type: 'drible', dependencies: ['d1'], tier: 2 },
  { id: 'd3', name: 'Drible Fantasma', description: 'Seja imprevisível com cortes secos em alta velocidade.', requiredXp: 4000, unlocked: false, type: 'drible', dependencies: ['v2', 'd2'], tier: 3 },
  { id: 'd4', name: 'Quebra-Tornozelos', description: 'Cortes diretos brutais capazes de levar os defensores ao chão na gravidade.', requiredXp: 8000, unlocked: false, type: 'drible', dependencies: ['d3'], tier: 4 },
  { id: 'd5', name: 'Roleta do Imperador (360)', description: 'Utilizar os adversários como apoio estático e girar ao redor deles, esmagando suas expectativas.', requiredXp: 16000, unlocked: false, type: 'drible', dependencies: ['d4'], tier: 5 },
  
  // Mentalidade
  { id: 'm1', name: 'Escaneamento', description: 'Olhar por cima do ombro.', requiredXp: 0, unlocked: true, type: 'mentalidade', dependencies: [], tier: 1 },
  { id: 'm2', name: 'Visão Espacial', description: 'Capacidade de ver o campo como um tabuleiro geométrico.', requiredXp: 2000, unlocked: false, type: 'mentalidade', dependencies: ['m1'], tier: 2 },
  { id: 'm3', name: 'Metavisão', description: 'Processamento simultâneo do campo: absorver movimentos de todos os aliados e inimigos.', requiredXp: 6000, unlocked: false, type: 'mentalidade', dependencies: ['m2'], tier: 3 },
  { id: 'm4', name: 'Reflexo de Previsão', description: 'Dedução lógica absoluta, sabendo exatamente onde a bola vai cair e os perigos do campo.', requiredXp: 10000, unlocked: false, type: 'mentalidade', dependencies: ['m3'], tier: 4 },
  { id: 'm5', name: 'Manipulador Global/Titereiro', description: 'Usar a inteligência de aliados e inimigos sem que notem como peças forçadas em seu esquema perfeito de jogo.', requiredXp: 20000, unlocked: false, type: 'mentalidade', dependencies: ['m4'], tier: 5 },
  
  // Passe Branch
  { id: 'p1', name: 'Passe Reto', description: 'Tocar de lado firme para construção básica.', requiredXp: 0, unlocked: true, type: 'passe', dependencies: [], tier: 1 },
  { id: 'p2', name: 'Passe em Profundidade', description: 'Injecção de bola crua nas costas da defesa adversária.', requiredXp: 1500, unlocked: false, type: 'passe', dependencies: ['p1', 'm1'], tier: 2 },
  { id: 'p3', name: 'Passe Cruzado/Fatiado', description: 'Esconder o movimento da perna antes de fazer um lançamento diagonal preciso que encontra o atacante nas pontas.', requiredXp: 3500, unlocked: false, type: 'passe', dependencies: ['p2'], tier: 3 },
  { id: 'p4', name: 'Passe Racional No-Look', description: 'Confiar totalmente na avaliação da visão espacial sem mirar no jogador alvo, induzindo o erro fatal dos zagueiros.', requiredXp: 7500, unlocked: false, type: 'passe', dependencies: ['p3', 'm2'], tier: 4 },
  
  // Resistencia Branch
  { id: 'r1', name: 'Fôlego', description: 'Terminar 1 hora de prática sem fadiga visível.', requiredXp: 0, unlocked: true, type: 'resistencia', dependencies: [], tier: 1 },
  { id: 'r2', name: 'Recuperação Rápida', description: 'Capacidade de encadear sprints violentos com intervalo menor de descanso respiratório.', requiredXp: 1800, unlocked: false, type: 'resistencia', dependencies: ['r1'], tier: 2 },
  { id: 'r3', name: 'Atleta Otimizado', description: 'Respirar apenas pelo nariz sob pressão extrema de jogo e economizar oxigênio celular, controlando as correntes limitadoras do corpo.', requiredXp: 4500, unlocked: false, type: 'resistencia', dependencies: ['r2'], tier: 3 },
  { id: 'r4', name: 'Físico Inabalável (Aura Monstruosa)', description: 'Transformar impacto físico e contato com rivais numa troca favorável, derrubando e quebrando marcação ombro a ombro implacável.', requiredXp: 9000, unlocked: false, type: 'resistencia', dependencies: ['r3'], tier: 4 },
];

const calculateRank = (xp: number): Rank => {
  if (xp < 1000) return 'Z';
  if (xp < 2500) return 'Y';
  if (xp < 5000) return 'X';
  if (xp < 8000) return 'W';
  if (xp < 12000) return 'V';
  if (xp < 18000) return 'U';
  if (xp < 30000) return 'A';
  return 'S';
};

export const useEgoStore = create<EgoState>()(
  persist(
    (set, get) => ({
      xp: 0,
      rank: 'Z',
      skills: INITIAL_SKILLS,
      history: [],

      addXp: (amount) => {
        set((state) => {
          const newXp = state.xp + amount;
          const newRank = calculateRank(newXp);
          return { xp: newXp, rank: newRank };
        });
        get().checkUnlocks();
      },

      completeTraining: (session) => {
        const newSession: TrainingSession = {
          ...session,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
        };
        
        set((state) => ({
          history: [newSession, ...state.history],
        }));
        
        get().addXp(session.xpEarned);
      },

      checkUnlocks: () => {
        set((state) => {
          const updatedSkills = state.skills.map(skill => {
            // Check if all dependencies are met
            const depsMet = skill.dependencies.every(depId => {
              const depSkill = state.skills.find(s => s.id === depId);
              return depSkill && (depSkill.unlocked || state.xp >= depSkill.requiredXp);
            });
            
            const isUnlockedNow = skill.unlocked || (state.xp >= skill.requiredXp && depsMet);
            
            return {
              ...skill,
              unlocked: isUnlockedNow
            };
          });
          return { skills: updatedSkills };
        });
      },

      resetProgress: () => {
        set({
          xp: 0,
          rank: 'Z',
          skills: INITIAL_SKILLS,
          history: []
        });
      }
    }),
    {
      name: 'bluelock-ego-storage-v3', // bumped version to reset storage and apply new tree expansion
    }
  )
);
