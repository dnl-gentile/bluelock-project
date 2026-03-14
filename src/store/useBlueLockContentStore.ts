import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_TRAINING_DRILLS,
  DEFAULT_WIKI_ENTRIES,
  type TrainingDrill,
  type WikiEntry,
} from '@lib/bluelock-content';
import type { WikiCategoryId } from '@lib/bluelock-taxonomy';

export interface ActiveTrainingPlan {
  title: string;
  focus: string;
  rationale: string;
  appliesToToday: boolean;
  drills: TrainingDrill[];
  source: 'default' | 'anri';
  updatedAt: string;
}

interface BlueLockContentState {
  ownerUid: string | null;
  wikiEntries: Record<WikiCategoryId, WikiEntry[]>;
  trainingPlan: ActiveTrainingPlan;
  bindOwner: (uid: string | null) => void;
  hydrateFromCloud: (payload: { wikiEntries?: Record<WikiCategoryId, WikiEntry[]>; trainingPlan?: ActiveTrainingPlan }, uid: string) => void;
  addWikiEntries: (entries: Array<Omit<WikiEntry, 'id'> & { id?: string }>) => void;
  setTrainingPlan: (plan: Omit<ActiveTrainingPlan, 'source' | 'updatedAt'>, source?: ActiveTrainingPlan['source']) => void;
  resetContent: () => void;
}

const DEFAULT_TRAINING_PLAN: ActiveTrainingPlan = {
  title: 'Treino do Dia',
  focus: 'Explosão & Ataque',
  rationale: 'Protocolo base do dia para desenvolver aceleração, drible curto e finalização agressiva.',
  appliesToToday: true,
  drills: DEFAULT_TRAINING_DRILLS,
  source: 'default',
  updatedAt: new Date().toISOString(),
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createWikiEntryId(category: WikiCategoryId, title: string) {
  return `wiki-${category}-${slugify(title)}`;
}

export const useBlueLockContentStore = create<BlueLockContentState>()(
  persist(
    (set) => ({
      ownerUid: null,
      wikiEntries: DEFAULT_WIKI_ENTRIES,
      trainingPlan: DEFAULT_TRAINING_PLAN,

      bindOwner: (uid) => {
        set((state) => {
          if (state.ownerUid === uid) {
            return state;
          }

          return {
            ownerUid: uid,
            wikiEntries: DEFAULT_WIKI_ENTRIES,
            trainingPlan: DEFAULT_TRAINING_PLAN,
          };
        });
      },

      hydrateFromCloud: (payload, uid) => {
        set({
          ownerUid: uid,
          wikiEntries: payload.wikiEntries ?? DEFAULT_WIKI_ENTRIES,
          trainingPlan: payload.trainingPlan ?? DEFAULT_TRAINING_PLAN,
        });
      },

      addWikiEntries: (entries) => {
        set((state) => {
          const nextEntries = { ...state.wikiEntries };

          for (const entry of entries) {
            const category = entry.category;
            const current = [...(nextEntries[category] ?? [])];
            const incomingTitle = entry.title.trim().toLocaleLowerCase('pt-BR');
            const existingIndex = current.findIndex(
              (candidate) => candidate.title.trim().toLocaleLowerCase('pt-BR') === incomingTitle
            );

            const normalizedEntry: WikiEntry = {
              ...entry,
              id: entry.id ?? createWikiEntryId(category, entry.title),
              drillId: entry.drillId ?? null,
            };

            if (existingIndex >= 0) {
              current[existingIndex] = {
                ...current[existingIndex],
                ...normalizedEntry,
              };
            } else {
              current.unshift(normalizedEntry);
            }

            nextEntries[category] = current;
          }

          return { wikiEntries: nextEntries };
        });
      },

      setTrainingPlan: (plan, source = 'anri') => {
        set({
          trainingPlan: {
            ...plan,
            source,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      resetContent: () => {
        set({
          ownerUid: null,
          wikiEntries: DEFAULT_WIKI_ENTRIES,
          trainingPlan: DEFAULT_TRAINING_PLAN,
        });
      },
    }),
    {
      name: 'bluelock-content-storage-v1',
    }
  )
);
