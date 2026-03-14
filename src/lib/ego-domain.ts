import type { SkillTier, SkillType } from '@lib/bluelock-taxonomy';

export interface Skill {
  id: string;
  name: string;
  description: string;
  requiredXp: number;
  unlocked: boolean;
  type: SkillType;
  dependencies: string[];
  tier: SkillTier;
  createdBy: 'system' | 'anri';
  linkedWikiEntryTitle?: string | null;
}

export interface SkillAlert {
  kind: 'dependency' | 'path';
  message: string;
}

export const DEFAULT_SKILLS: Skill[] = [
  { id: 'c1', name: 'Domínio Básico', description: 'O primeiro passo para despertar seu Ego.', requiredXp: 0, unlocked: true, type: 'chute', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'c2', name: 'Chute de Peito de Pé', description: 'Finalização firme com o osso do pé.', requiredXp: 500, unlocked: false, type: 'chute', dependencies: ['c1'], tier: 2, createdBy: 'system' },
  { id: 'c3', name: 'Chute Direto (Ego)', description: 'Finalização perfeita de primeira.', requiredXp: 2500, unlocked: false, type: 'chute', dependencies: ['c2'], tier: 3, createdBy: 'system' },
  { id: 'c4', name: 'Trivela Letal', description: 'Chute com curva externa violenta para fugir do goleiro.', requiredXp: 6000, unlocked: false, type: 'chute', dependencies: ['c3', 'p2'], tier: 4, createdBy: 'system' },
  { id: 'c5', name: 'Predador (Olhar Sniper)', description: 'Precisão milimétrica, visando pontos cegos do goleiro a enorme distância.', requiredXp: 12000, unlocked: false, type: 'chute', dependencies: ['c4'], tier: 5, createdBy: 'system' },
  { id: 'v1', name: 'Corrida Estável', description: 'Fundamentos de biomecânica.', requiredXp: 0, unlocked: true, type: 'velocidade', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'v2', name: 'Aceleração Explosiva', description: 'Ganhe velocidade no primeiro passo.', requiredXp: 800, unlocked: false, type: 'velocidade', dependencies: ['v1'], tier: 2, createdBy: 'system' },
  { id: 'v3', name: 'Corrida sem Bola', description: 'Desmarque-se com passos em ponto cego.', requiredXp: 3000, unlocked: false, type: 'velocidade', dependencies: ['v2'], tier: 3, createdBy: 'system' },
  { id: 'v4', name: 'Zona de Fluxo Máximo', description: 'Manutenção de aceleração inumana superior a 35km/h na ponta.', requiredXp: 7000, unlocked: false, type: 'velocidade', dependencies: ['v3', 'r2'], tier: 4, createdBy: 'system' },
  { id: 'v5', name: 'Velocidade Divina', description: 'Arranque imbatível, impossível de ser acompanhado a olho nu.', requiredXp: 15000, unlocked: false, type: 'velocidade', dependencies: ['v4'], tier: 5, createdBy: 'system' },
  { id: 'd1', name: 'Controle Curto', description: 'Manter a bola próxima ao pé no trote.', requiredXp: 0, unlocked: true, type: 'drible', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'd2', name: 'Ginga de Corpo', description: 'Desequilibrar oponente sem tocar na bola.', requiredXp: 1200, unlocked: false, type: 'drible', dependencies: ['d1'], tier: 2, createdBy: 'system' },
  { id: 'd3', name: 'Drible Fantasma', description: 'Seja imprevisível com cortes secos em alta velocidade.', requiredXp: 4000, unlocked: false, type: 'drible', dependencies: ['v2', 'd2'], tier: 3, createdBy: 'system' },
  { id: 'd4', name: 'Quebra-Tornozelos', description: 'Cortes diretos brutais capazes de levar os defensores ao chão na gravidade.', requiredXp: 8000, unlocked: false, type: 'drible', dependencies: ['d3'], tier: 4, createdBy: 'system' },
  { id: 'd5', name: 'Roleta do Imperador (360)', description: 'Utilizar os adversários como apoio estático e girar ao redor deles, esmagando suas expectativas.', requiredXp: 16000, unlocked: false, type: 'drible', dependencies: ['d4'], tier: 5, createdBy: 'system' },
  { id: 'm1', name: 'Escaneamento', description: 'Olhar por cima do ombro.', requiredXp: 0, unlocked: true, type: 'mentalidade', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'm2', name: 'Visão Espacial', description: 'Capacidade de ver o campo como um tabuleiro geométrico.', requiredXp: 2000, unlocked: false, type: 'mentalidade', dependencies: ['m1'], tier: 2, createdBy: 'system' },
  { id: 'm3', name: 'Metavisão', description: 'Processamento simultâneo do campo: absorver movimentos de todos os aliados e inimigos.', requiredXp: 6000, unlocked: false, type: 'mentalidade', dependencies: ['m2'], tier: 3, createdBy: 'system' },
  { id: 'm4', name: 'Reflexo de Previsão', description: 'Dedução lógica absoluta, sabendo exatamente onde a bola vai cair e os perigos do campo.', requiredXp: 10000, unlocked: false, type: 'mentalidade', dependencies: ['m3'], tier: 4, createdBy: 'system' },
  { id: 'm5', name: 'Manipulador Global/Titereiro', description: 'Usar a inteligência de aliados e inimigos sem que notem como peças forçadas em seu esquema perfeito de jogo.', requiredXp: 20000, unlocked: false, type: 'mentalidade', dependencies: ['m4'], tier: 5, createdBy: 'system' },
  { id: 'p1', name: 'Passe Reto', description: 'Tocar de lado firme para construção básica.', requiredXp: 0, unlocked: true, type: 'passe', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'p2', name: 'Passe em Profundidade', description: 'Injecção de bola crua nas costas da defesa adversária.', requiredXp: 1500, unlocked: false, type: 'passe', dependencies: ['p1', 'm1'], tier: 2, createdBy: 'system' },
  { id: 'p3', name: 'Passe Cruzado/Fatiado', description: 'Esconder o movimento da perna antes de fazer um lançamento diagonal preciso que encontra o atacante nas pontas.', requiredXp: 3500, unlocked: false, type: 'passe', dependencies: ['p2'], tier: 3, createdBy: 'system' },
  { id: 'p4', name: 'Passe Racional No-Look', description: 'Confiar totalmente na avaliação da visão espacial sem mirar no jogador alvo, induzindo o erro fatal dos zagueiros.', requiredXp: 7500, unlocked: false, type: 'passe', dependencies: ['p3', 'm2'], tier: 4, createdBy: 'system' },
  { id: 'r1', name: 'Fôlego', description: 'Terminar 1 hora de prática sem fadiga visível.', requiredXp: 0, unlocked: true, type: 'resistencia', dependencies: [], tier: 1, createdBy: 'system' },
  { id: 'r2', name: 'Recuperação Rápida', description: 'Capacidade de encadear sprints violentos com intervalo menor de descanso respiratório.', requiredXp: 1800, unlocked: false, type: 'resistencia', dependencies: ['r1'], tier: 2, createdBy: 'system' },
  { id: 'r3', name: 'Atleta Otimizado', description: 'Respirar apenas pelo nariz sob pressão extrema de jogo e economizar oxigênio celular, controlando as correntes limitadoras do corpo.', requiredXp: 4500, unlocked: false, type: 'resistencia', dependencies: ['r2'], tier: 3, createdBy: 'system' },
  { id: 'r4', name: 'Físico Inabalável (Aura Monstruosa)', description: 'Transformar impacto físico e contato com rivais numa troca favorável, derrubando e quebrando marcação ombro a ombro implacável.', requiredXp: 9000, unlocked: false, type: 'resistencia', dependencies: ['r3'], tier: 4, createdBy: 'system' },
];

export function cloneSkills(skills: Skill[]) {
  return skills.map((skill) => ({
    ...skill,
    dependencies: [...skill.dependencies],
  }));
}

export function normalizeSkillName(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

export function createSkillId(type: SkillType, name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `anri-${type}-${slug}`;
}

export function getSkillAlerts(skill: Skill, skills: Skill[]): SkillAlert[] {
  const alerts: SkillAlert[] = [];
  const advisoryDependencies = skill.dependencies
    .map((dependencyId) => skills.find((candidate) => candidate.id === dependencyId))
    .filter(Boolean) as Skill[];

  const missingDependencies = advisoryDependencies.filter((dependency) => !dependency.unlocked);
  if (missingDependencies.length > 0) {
    alerts.push({
      kind: 'dependency',
      message:
        missingDependencies.length === 1
          ? `Dependência recomendada ainda não absorvida: ${missingDependencies[0].name}.`
          : `Dependências recomendadas ainda não absorvidas: ${missingDependencies
              .map((dependency) => dependency.name)
              .join(', ')}.`,
    });
  }

  const hasUnlockedBranchProgress = skills.some(
    (candidate) =>
      candidate.id !== skill.id &&
      candidate.type === skill.type &&
      candidate.tier < skill.tier &&
      candidate.unlocked
  );

  if (skill.tier > 1 && !hasUnlockedBranchProgress) {
    alerts.push({
      kind: 'path',
      message: 'Você está tentando encaixar essa técnica fora da trilha atual dessa habilidade.',
    });
  }

  return alerts;
}
