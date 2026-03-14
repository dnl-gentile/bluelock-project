import type { DrillType, WikiCategoryId } from '@lib/bluelock-taxonomy';

export interface WikiCategory {
  id: WikiCategoryId;
  label: string;
  color: string;
}

export interface WikiEntry {
  id: string;
  category: WikiCategoryId;
  title: string;
  text: string;
  drillId: number | null;
}

export interface TrainingDrill {
  id: number;
  title: string;
  emoji: string;
  type: DrillType;
  description: string;
  topics: string[];
  videoUrl: string;
}

export const WIKI_CATEGORIES: WikiCategory[] = [
  { id: 'chute', label: 'Chute', color: '#ff003c' },
  { id: 'velocidade', label: 'Velocidade', color: '#1d4ed8' },
  { id: 'drible', label: 'Drible', color: '#3b82f6' },
  { id: 'tatica', label: 'Tática/Visão', color: '#c084fc' },
  { id: 'passe', label: 'Passe', color: '#f59e0b' },
  { id: 'resistencia', label: 'Resistência', color: '#10b981' },
];

export const DEFAULT_WIKI_ENTRIES: Record<WikiCategoryId, WikiEntry[]> = {
  chute: [
    {
      id: 'wiki-chute-1',
      category: 'chute',
      title: 'Chute de Peito de Pé (Laces)',
      text: 'O chute mais potente. Você atinge a bola com o osso rígido na parte superior do pé, onde ficam os cadarços. Ideal para finalizações de média e longa distância.',
      drillId: 3,
    },
    {
      id: 'wiki-chute-2',
      category: 'chute',
      title: 'Chute Direto (Volley)',
      text: 'Pegar a bola no ar antes que ela caia. Exige tempo de bola, olhos fixos no contato e corpo por cima da bola para manter a finalização baixa.',
      drillId: null,
    },
  ],
  drible: [
    {
      id: 'wiki-drible-1',
      category: 'drible',
      title: 'Drible Fantasma (Tesoura)',
      text: 'Passe o pé por cima da bola, de dentro para fora, ameaçando ir para um lado. Com o outro pé, empurre a bola para o lado oposto e acelere.',
      drillId: 2,
    },
    {
      id: 'wiki-drible-2',
      category: 'drible',
      title: 'Drible da Vaca / Meia Lua',
      text: 'Toque a bola por um lado do oponente e corra pelo outro. Funciona melhor quando o marcador está pesado nos calcanhares ou olhando apenas para a bola.',
      drillId: null,
    },
  ],
  tatica: [
    {
      id: 'wiki-tatica-1',
      category: 'tatica',
      title: 'Metavisão',
      text: 'Escaneamento constante. Antes de receber a bola, olhe por cima dos ombros e atualize mentalmente o mapa do campo, dos espaços e das linhas de passe.',
      drillId: null,
    },
    {
      id: 'wiki-tatica-2',
      category: 'tatica',
      title: 'Isolamento (1v1)',
      text: 'Arraste o defensor para uma zona onde ele não tenha cobertura. O objetivo é transformar um duelo coletivo em um confronto totalmente favorável para você.',
      drillId: null,
    },
  ],
  velocidade: [
    {
      id: 'wiki-velocidade-1',
      category: 'velocidade',
      title: 'Aceleração de Resposta',
      text: 'Corridas curtas de 10 metros focando na explosão dos três primeiros passos, com tronco projetado e braços agressivos.',
      drillId: 1,
    },
  ],
  passe: [
    {
      id: 'wiki-passe-1',
      category: 'passe',
      title: 'Passe Fatiado (Trivela Cruzada)',
      text: 'Bater com os dedos de fora do pé arrastando a bola lateralmente para produzir curva e quebrar a linha defensiva antes de voltar para o corredor do atacante.',
      drillId: null,
    },
  ],
  resistencia: [
    {
      id: 'wiki-resistencia-1',
      category: 'resistencia',
      title: 'Descanso Celular Ativo',
      text: 'Treinar caminhada, controle do ritmo respiratório e respiração nasal nos segundos mortos do jogo para recuperar energia sem desligar da partida.',
      drillId: null,
    },
  ],
};

export const DEFAULT_TRAINING_DRILLS: TrainingDrill[] = [
  {
    id: 1,
    title: 'Aceleração de Resposta',
    emoji: '⚡️',
    type: 'velocidade',
    description: 'Corridas curtas de 10 metros focando na explosão dos três primeiros passos.',
    topics: [
      'Posição base agachada',
      'Corpo projetado para frente em 45 graus',
      'Foco total no momento de disparo',
    ],
    videoUrl: 'placeholder',
  },
  {
    id: 2,
    title: 'Drible Fantasma (Tesoura)',
    emoji: '👻',
    type: 'drible',
    description: 'Foque na ginga do quadril para desequilibrar o oponente antes de tocar na bola.',
    topics: [
      'Passe a perna por cima da bola sem tocá-la',
      'Mude o peso do corpo para vender o movimento',
      'Exploda para a direção oposta',
    ],
    videoUrl: 'placeholder',
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
      'Contato no osso do cadarço da chuteira',
    ],
    videoUrl: 'placeholder',
  },
];

export function flattenWikiEntries(source: Record<WikiCategoryId, WikiEntry[]>): WikiEntry[] {
  return Object.values(source).flat();
}
