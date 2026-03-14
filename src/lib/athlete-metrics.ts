import type { SkillType } from '@lib/bluelock-taxonomy';
import type { Skill } from '@lib/ego-domain';

export type TrainingLevel = 'Z' | 'Y' | 'X' | 'W' | 'V' | 'U' | 'A' | 'S';

export interface TrainingHistoryLike {
  date: string;
  type: string;
  xpEarned: number;
}

export interface TrainingDomainScore {
  id: SkillType;
  label: string;
  score: number;
  xp: number;
  sessions: number;
  unlockedSkills: number;
}

export interface WeeklyStreakDay {
  dateKey: string;
  label: string;
  isWeekend: boolean;
  trained: boolean;
}

export interface WeeklyStreakBreakdown {
  weekStartKey: string;
  trainedWeekdays: number;
  missedWeekdays: number;
  trainedWeekendDays: number;
  delta: number;
  protectedWeekend: boolean;
  compensationFulfilled: boolean;
  penaltyDays: number;
  days: WeeklyStreakDay[];
}

export interface StreakMetrics {
  current: number;
  currentWeek: WeeklyStreakBreakdown;
  weeks: WeeklyStreakBreakdown[];
}

export interface AthletePerformanceMetrics {
  level: TrainingLevel;
  leaderboardPosition: number;
  overallScore: number;
  radar: TrainingDomainScore[];
  streak: StreakMetrics;
  totalTrainingDays: number;
  unlockedSkills: number;
  distinctDomains: number;
}

const DOMAIN_META: Array<{ id: SkillType; label: string; keywords: string[] }> = [
  { id: 'velocidade', label: 'Vel', keywords: ['veloc', 'aceler', 'sprint', 'corrida', 'explos'] },
  { id: 'resistencia', label: 'Res', keywords: ['resist', 'folego', 'fôlego', 'cardio', 'descanso', 'recuper'] },
  { id: 'chute', label: 'Chute', keywords: ['chute', 'final', 'finaliz', 'vole', 'volley', 'laces', 'peito de pe', 'peito de pé'] },
  { id: 'drible', label: 'Drible', keywords: ['drible', 'tesoura', 'finta', 'ginga', 'fantasma'] },
  { id: 'passe', label: 'Passe', keywords: ['passe', 'trivela', 'assist', 'lan', 'enfiada'] },
  { id: 'mentalidade', label: 'Mente', keywords: ['meta', 'visao', 'visão', 'scan', 'leitura', 'tat', 'isolamento', 'decis'] },
];

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatLocalDateKey(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = `${referenceDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${referenceDate.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function startOfWeekMonday(referenceDate: Date) {
  const nextDate = new Date(referenceDate);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
}

function addDays(referenceDate: Date, days: number) {
  const nextDate = new Date(referenceDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getUniqueTrainingDateKeys(history: TrainingHistoryLike[]) {
  return Array.from(new Set(history.map((entry) => formatLocalDateKey(new Date(entry.date))))).sort((left, right) =>
    left.localeCompare(right, 'pt-BR')
  );
}

function inferDomainFromTrainingLabel(label: string): SkillType {
  const normalized = normalizeText(label);

  for (const domain of DOMAIN_META) {
    if (domain.keywords.some((keyword) => normalized.includes(keyword))) {
      return domain.id;
    }
  }

  return 'mentalidade';
}

function calculateTrainingLevelFromScore(score: number): TrainingLevel {
  if (score < 20) return 'Z';
  if (score < 33) return 'Y';
  if (score < 46) return 'X';
  if (score < 58) return 'W';
  if (score < 70) return 'V';
  if (score < 82) return 'U';
  if (score < 93) return 'A';
  return 'S';
}

export function calculateStreakMetrics(
  history: TrainingHistoryLike[],
  referenceDate = new Date()
): StreakMetrics {
  const uniqueDateKeys = getUniqueTrainingDateKeys(history);
  const trainedDateSet = new Set(uniqueDateKeys);
  const currentWeekStart = startOfWeekMonday(referenceDate);
  const firstTrackedDate = uniqueDateKeys.length ? parseDateKey(uniqueDateKeys[0]) : currentWeekStart;
  const firstWeekStart = startOfWeekMonday(firstTrackedDate);
  const weeks: WeeklyStreakBreakdown[] = [];
  let cursor = firstWeekStart;
  let current = 0;

  while (cursor.getTime() <= currentWeekStart.getTime()) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(cursor, index);
      const dateKey = formatLocalDateKey(date);
      return {
        dateKey,
        label: WEEKDAY_LABELS[index],
        isWeekend: index >= 5,
        trained: trainedDateSet.has(dateKey),
      } satisfies WeeklyStreakDay;
    });

    const trainedWeekdays = days.filter((day) => !day.isWeekend && day.trained).length;
    const trainedWeekendDays = days.filter((day) => day.isWeekend && day.trained).length;
    const missedWeekdays = 5 - trainedWeekdays;
    const protectedWeekend = missedWeekdays === 0;
    const compensationFulfilled = missedWeekdays === 1 && trainedWeekendDays === 2;
    const penaltyDays = missedWeekdays >= 2 ? (missedWeekdays - 1) * 2 : 0;

    let delta = 0;
    if (missedWeekdays === 0) {
      delta = 7;
    } else if (missedWeekdays === 1) {
      delta = trainedWeekdays + (compensationFulfilled ? 2 : 0);
    } else {
      delta = trainedWeekdays + trainedWeekendDays - penaltyDays;
    }

    current = Math.max(0, current + delta);
    weeks.push({
      weekStartKey: formatLocalDateKey(cursor),
      trainedWeekdays,
      missedWeekdays,
      trainedWeekendDays,
      delta,
      protectedWeekend,
      compensationFulfilled,
      penaltyDays,
      days,
    });

    cursor = addDays(cursor, 7);
  }

  return {
    current,
    currentWeek:
      weeks[weeks.length - 1] ??
      {
        weekStartKey: formatLocalDateKey(currentWeekStart),
        trainedWeekdays: 0,
        missedWeekdays: 5,
        trainedWeekendDays: 0,
        delta: 0,
        protectedWeekend: false,
        compensationFulfilled: false,
        penaltyDays: 0,
        days: Array.from({ length: 7 }, (_, index) => {
          const date = addDays(currentWeekStart, index);
          return {
            dateKey: formatLocalDateKey(date),
            label: WEEKDAY_LABELS[index],
            isWeekend: index >= 5,
            trained: false,
          };
        }),
      },
    weeks,
  };
}

export function calculateAthletePerformanceMetrics(params: {
  xp: number;
  history: TrainingHistoryLike[];
  skills: Skill[];
  referenceDate?: Date;
}): AthletePerformanceMetrics {
  const typedHistory = params.history.map((entry) => ({
    ...entry,
    inferredDomain: inferDomainFromTrainingLabel(entry.type),
    dateKey: formatLocalDateKey(new Date(entry.date)),
    isRecent: Date.now() - new Date(entry.date).getTime() <= 21 * 24 * 60 * 60 * 1000,
  }));
  const streak = calculateStreakMetrics(params.history, params.referenceDate);
  const totalTrainingDays = new Set(typedHistory.map((entry) => entry.dateKey)).size;
  const unlockedSkills = params.skills.filter((skill) => skill.unlocked);
  const distinctDomains = new Set(typedHistory.map((entry) => entry.inferredDomain)).size;

  const radar = DOMAIN_META.map((domain) => {
    const domainHistory = typedHistory.filter((entry) => entry.inferredDomain === domain.id);
    const domainTrainingDays = new Set(domainHistory.map((entry) => entry.dateKey)).size;
    const domainRecentDays = new Set(domainHistory.filter((entry) => entry.isRecent).map((entry) => entry.dateKey)).size;
    const domainXp = domainHistory.reduce((sum, entry) => sum + entry.xpEarned, 0);
    const domainSkills = params.skills.filter((skill) => skill.type === domain.id);
    const unlockedDomainSkills = domainSkills.filter((skill) => skill.unlocked).length;

    const sessionScore = clamp((domainTrainingDays / 10) * 100, 0, 100);
    const xpScore = clamp((domainXp / 2200) * 100, 0, 100);
    const recencyScore = clamp((domainRecentDays / 4) * 100, 0, 100);
    const skillScore = domainSkills.length ? (unlockedDomainSkills / domainSkills.length) * 100 : 0;
    const score = Math.round(
      clamp(
        (params.history.length > 0 ? 8 : 0) + xpScore * 0.35 + sessionScore * 0.25 + recencyScore * 0.15 + skillScore * 0.25,
        0,
        100
      )
    );

    return {
      id: domain.id,
      label: domain.label,
      score,
      xp: domainXp,
      sessions: domainTrainingDays,
      unlockedSkills: unlockedDomainSkills,
    } satisfies TrainingDomainScore;
  });

  const radarAverage = radar.reduce((sum, domain) => sum + domain.score, 0) / radar.length;
  const sessionScore = clamp((totalTrainingDays / 40) * 100, 0, 100);
  const xpScore = clamp((params.xp / 12000) * 100, 0, 100);
  const skillScore = params.skills.length ? (unlockedSkills.length / params.skills.length) * 100 : 0;
  const consistencyScore = clamp((streak.current / 42) * 100, 0, 100);
  const varietyScore = clamp((distinctDomains / DOMAIN_META.length) * 100, 0, 100);
  const overallScore = Math.round(
    clamp(
      radarAverage * 0.34 +
        consistencyScore * 0.18 +
        skillScore * 0.16 +
        sessionScore * 0.14 +
        xpScore * 0.12 +
        varietyScore * 0.06,
      0,
      100
    )
  );
  const level = calculateTrainingLevelFromScore(overallScore);
  const leaderboardPosition = clamp(275 - Math.round((overallScore / 100) * 274), 1, 275);

  return {
    level,
    leaderboardPosition,
    overallScore,
    radar,
    streak,
    totalTrainingDays,
    unlockedSkills: unlockedSkills.length,
    distinctDomains,
  };
}
