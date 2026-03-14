import type { TrainingSession } from '@store/useEgoStore';
import type {
  AthleteLocationSnapshot,
  AthleteWeatherSnapshot,
  BlueLockNotification,
  DailyBriefing,
} from '@store/useAthleteProfileStore';
import { calculateStreakMetrics } from '@lib/athlete-metrics';

const BERNARDO_BIRTH_DATE = new Date('2014-09-10T12:00:00-03:00');

const WEATHER_CODE_LOOKUP: Record<number, { condition: AthleteWeatherSnapshot['condition']; description: string }> = {
  0: { condition: 'Clear', description: 'céu limpo para atacar espaços' },
  1: { condition: 'Clear', description: 'sol aberto e campo leve' },
  2: { condition: 'Clouds', description: 'nuvens leves e leitura limpa' },
  3: { condition: 'Clouds', description: 'céu fechado, mas jogo vivo' },
  45: { condition: 'Fog', description: 'névoa leve, visão curta' },
  48: { condition: 'Fog', description: 'névoa densa, leitura limitada' },
  51: { condition: 'Rain', description: 'garoa fina, pede controle' },
  53: { condition: 'Rain', description: 'chuva leve, campo escorregadio' },
  55: { condition: 'Rain', description: 'chuva constante, controle acima da força' },
  61: { condition: 'Rain', description: 'chuva leve, bom para primeiro toque' },
  63: { condition: 'Rain', description: 'chuva moderada, treino pede ajustes' },
  65: { condition: 'Rain', description: 'chuva forte, protocolo indoor recomendado' },
  71: { condition: 'Clouds', description: 'frio seco, corpo precisa acordar cedo' },
  80: { condition: 'Rain', description: 'pancadas rápidas, prepara plano B' },
  81: { condition: 'Rain', description: 'pancadas moderadas, controle e leitura' },
  82: { condition: 'Rain', description: 'pancadas pesadas, segurança primeiro' },
  95: { condition: 'Wind', description: 'tempestade por perto, atenção total' },
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

export function formatLocalDateKey(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = `${referenceDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${referenceDate.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getBernardoAge(referenceDate = new Date()) {
  let age = referenceDate.getFullYear() - BERNARDO_BIRTH_DATE.getFullYear();
  const hasHadBirthdayThisYear =
    referenceDate.getMonth() > BERNARDO_BIRTH_DATE.getMonth() ||
    (referenceDate.getMonth() === BERNARDO_BIRTH_DATE.getMonth() &&
      referenceDate.getDate() >= BERNARDO_BIRTH_DATE.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function getAthleteStage(age: number) {
  if (age <= 8) {
    return 'Fase 1: Base do Atleta';
  }
  if (age <= 11) {
    return 'Fase 2: O Despertar da Arma';
  }
  if (age <= 14) {
    return 'Fase 3: Visão de Jogo';
  }
  return 'Fase 4: O Mestre do Ego';
}

export function calculateTrainingStreak(history: TrainingSession[], referenceDate = new Date()) {
  return calculateStreakMetrics(history, referenceDate).current;
}

function getLatestTraining(history: TrainingSession[]) {
  return [...history].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0] ?? null;
}

export function buildDailyBriefing({
  history,
  rank,
  referenceDate = new Date(),
}: {
  history: TrainingSession[];
  rank: string;
  referenceDate?: Date;
}): DailyBriefing {
  const streak = calculateTrainingStreak(history, referenceDate);
  const age = getBernardoAge(referenceDate);
  const stage = getAthleteStage(age);
  const latestTraining = getLatestTraining(history);
  const latestDate = latestTraining ? new Date(latestTraining.date) : null;
  const todayKey = formatLocalDateKey(referenceDate);
  const latestKey = latestDate ? formatLocalDateKey(latestDate) : null;
  const diffInDays = latestDate
    ? Math.round((new Date(`${todayKey}T12:00:00`).getTime() - new Date(`${latestKey}T12:00:00`).getTime()) / 86400000)
    : null;

  const hotLines = [
    `Fase 2 ativada. ${streak} dias seguidos e o Rank ${rank} já começou a morder de volta.`,
    `Bernardo está em rotação alta: ${streak} dias de ofensiva e leitura de campo ficando mais afiada.`,
    `O ego acordou cedo hoje. ${streak} dias seguidos e a arma já está criando casca.`,
  ];
  const idleLines = [
    `O radar acusa campo frio. A Fase 2 não sobe de nível parada no banco.`,
    `Tem talento aí, mas talento cochilando vira zagueiro feliz. Bora acordar o ego.`,
    `Sem treino recente, o sistema entrou em modo caça-desculpa. Anri não aprovou.`,
  ];
  const steadyLines = [
    `Ritmo controlado. A Fase 2 está sendo montada peça por peça, sem queimar etapa.`,
    `O motor está girando, mas ainda cabe mais veneno no último terço.`,
    `Bom volume recente. Falta transformar consistência em ameaça real.`,
  ];

  let subheadline = '';

  if (streak >= 3) {
    subheadline = hotLines[clampIndex(referenceDate.getDate() % hotLines.length, hotLines.length)];
  } else if (diffInDays === null || diffInDays >= 2) {
    subheadline = idleLines[clampIndex(referenceDate.getDate() % idleLines.length, idleLines.length)];
  } else {
    subheadline = steadyLines[clampIndex(referenceDate.getDate() % steadyLines.length, steadyLines.length)];
  }

  if (latestTraining && latestKey === todayKey) {
    subheadline = `Treino de hoje já entrou no sistema com ${latestTraining.xpEarned} XP. Agora é lapidar a execução sem relaxar.`;
  }

  return {
    date: todayKey,
    headline: `${stage} · ${age} anos`,
    subheadline,
    createdAt: referenceDate.toISOString(),
  };
}

export function resolveBrowserLocation() {
  return new Promise<AthleteLocationSnapshot>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalização indisponível neste navegador.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Clima local',
          updatedAt: new Date().toISOString(),
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 60,
      }
    );
  });
}

export async function fetchWeatherForLocation(
  location: AthleteLocationSnapshot
): Promise<AthleteWeatherSnapshot> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Falha ao consultar o clima local.');
  }

  const data = await response.json();
  const weatherCode = Number(data?.current?.weather_code ?? -1);
  const mapped = WEATHER_CODE_LOOKUP[weatherCode] ?? {
    condition: 'Unknown' as const,
    description: 'condição indefinida, leitura adaptativa',
  };

  return {
    temp: Math.round(Number(data?.current?.temperature_2m ?? 0)),
    condition: mapped.condition,
    description: mapped.description,
    locationLabel: location.label || 'Clima local',
    fetchedAt: new Date().toISOString(),
  };
}

export function createNotificationId(type: BlueLockNotification['type'], dateKey: string) {
  return `${type}-${dateKey}`;
}

export function createDailyQuoteNotification(briefing: DailyBriefing): BlueLockNotification {
  return {
    id: createNotificationId('daily_quote', briefing.date),
    type: 'daily_quote',
    title: 'Mensagem do Ego',
    body: briefing.subheadline,
    createdAt: briefing.createdAt,
  };
}

export function createTrainingPlanNotification(dateKey: string, title: string): BlueLockNotification {
  return {
    id: createNotificationId('training_plan', dateKey),
    type: 'training_plan',
    title: 'Protocolo do Dia Liberado',
    body: `Bernardo, a Anri já montou o treino "${title}". 13h é a hora de entrar no campo e devorar espaço.`,
    createdAt: new Date().toISOString(),
  };
}

export function createTrainingNudgeNotification(dateKey: string, streak: number): BlueLockNotification {
  return {
    id: createNotificationId('training_nudge', dateKey),
    type: 'training_nudge',
    title: 'O Campo Não Espera',
    body:
      streak > 0
        ? `Sua ofensiva está em ${streak} dias. Não deixa o ego esfriar agora.`
        : 'Sem treino hoje ainda. Até o rival menos talentoso cresce quando você adia o próximo toque.',
    createdAt: new Date().toISOString(),
  };
}

export function createMotivationNotification(dateKey: string, rank: string): BlueLockNotification {
  return {
    id: createNotificationId('motivation', dateKey),
    type: 'motivation',
    title: 'Blue Lock Ping',
    body: `Rank ${rank} ainda é só a placa na porta. O treino de hoje decide quem entra.`,
    createdAt: new Date().toISOString(),
  };
}
