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

export interface PendingTrainingPlan extends ActiveTrainingPlan {
  suggestedAt: string;
  suggestedBy: 'anri' | 'daily_routine';
  suggestedPresetName?: string | null;
}

export interface TrainingPreset {
  id: string;
  name: string;
  savedAt: string;
  source: 'manual' | 'anri';
  plan: ActiveTrainingPlan;
}

interface BlueLockContentState {
  ownerUid: string | null;
  wikiEntries: Record<WikiCategoryId, WikiEntry[]>;
  trainingPlan: ActiveTrainingPlan;
  pendingTrainingPlan: PendingTrainingPlan | null;
  trainingPresets: TrainingPreset[];
  bindOwner: (uid: string | null) => void;
  hydrateFromCloud: (
    payload: {
      wikiEntries?: Record<WikiCategoryId, WikiEntry[]>;
      trainingPlan?: ActiveTrainingPlan;
      pendingTrainingPlan?: PendingTrainingPlan | null;
      trainingPresets?: TrainingPreset[];
    },
    uid: string
  ) => void;
  addWikiEntries: (entries: Array<Omit<WikiEntry, 'id'> & { id?: string }>) => void;
  setTrainingPlan: (plan: Omit<ActiveTrainingPlan, 'source' | 'updatedAt'>, source?: ActiveTrainingPlan['source']) => void;
  suggestTrainingPlan: (
    plan: Omit<ActiveTrainingPlan, 'source' | 'updatedAt'>,
    options?: { suggestedBy?: PendingTrainingPlan['suggestedBy']; presetName?: string | null; source?: ActiveTrainingPlan['source'] }
  ) => void;
  activatePendingTrainingPlan: () => void;
  dismissPendingTrainingPlan: () => void;
  saveTrainingPreset: (name: string, plan?: ActiveTrainingPlan, source?: TrainingPreset['source']) => void;
  savePendingTrainingAsPreset: (name?: string) => void;
  activateTrainingPreset: (presetId: string) => void;
  removeTrainingPreset: (presetId: string) => void;
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

function cloneTrainingDrill(drill: TrainingDrill): TrainingDrill {
  return {
    ...drill,
    topics: [...drill.topics],
  };
}

function cloneTrainingPlan(plan: ActiveTrainingPlan): ActiveTrainingPlan {
  return {
    ...plan,
    drills: plan.drills.map(cloneTrainingDrill),
  };
}

function createDefaultTrainingPlan() {
  return cloneTrainingPlan(DEFAULT_TRAINING_PLAN);
}

function createTrainingPresetId(name: string) {
  return `preset-${slugify(name)}-${Date.now()}`;
}

function toActiveTrainingPlan(
  plan: Omit<ActiveTrainingPlan, 'source' | 'updatedAt'>,
  source: ActiveTrainingPlan['source']
): ActiveTrainingPlan {
  return {
    ...plan,
    drills: plan.drills.map(cloneTrainingDrill),
    source,
    updatedAt: new Date().toISOString(),
  };
}

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
      trainingPlan: createDefaultTrainingPlan(),
      pendingTrainingPlan: null,
      trainingPresets: [],

      bindOwner: (uid) => {
        set((state) => {
          if (state.ownerUid === uid) {
            return state;
          }

          return {
            ownerUid: uid,
            wikiEntries: DEFAULT_WIKI_ENTRIES,
            trainingPlan: createDefaultTrainingPlan(),
            pendingTrainingPlan: null,
            trainingPresets: [],
          };
        });
      },

      hydrateFromCloud: (payload, uid) => {
        set({
          ownerUid: uid,
          wikiEntries: payload.wikiEntries ?? DEFAULT_WIKI_ENTRIES,
          trainingPlan: payload.trainingPlan ? cloneTrainingPlan(payload.trainingPlan) : createDefaultTrainingPlan(),
          pendingTrainingPlan: payload.pendingTrainingPlan
            ? {
                ...payload.pendingTrainingPlan,
                drills: payload.pendingTrainingPlan.drills.map(cloneTrainingDrill),
              }
            : null,
          trainingPresets: payload.trainingPresets?.map((preset) => ({
            ...preset,
            plan: cloneTrainingPlan(preset.plan),
          })) ?? [],
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
          trainingPlan: toActiveTrainingPlan(plan, source),
          pendingTrainingPlan: null,
        });
      },

      suggestTrainingPlan: (plan, options) => {
        set({
          pendingTrainingPlan: {
            ...toActiveTrainingPlan(plan, options?.source ?? 'anri'),
            suggestedAt: new Date().toISOString(),
            suggestedBy: options?.suggestedBy ?? 'anri',
            suggestedPresetName: options?.presetName ?? null,
          },
        });
      },

      activatePendingTrainingPlan: () => {
        set((state) => {
          if (!state.pendingTrainingPlan) {
            return state;
          }

          return {
            trainingPlan: {
              title: state.pendingTrainingPlan.title,
              focus: state.pendingTrainingPlan.focus,
              rationale: state.pendingTrainingPlan.rationale,
              appliesToToday: state.pendingTrainingPlan.appliesToToday,
              drills: state.pendingTrainingPlan.drills.map(cloneTrainingDrill),
              source: state.pendingTrainingPlan.source,
              updatedAt: new Date().toISOString(),
            },
            pendingTrainingPlan: null,
          };
        });
      },

      dismissPendingTrainingPlan: () => {
        set({ pendingTrainingPlan: null });
      },

      saveTrainingPreset: (name, plan, source = 'manual') => {
        set((state) => {
          const planToSave = plan ? cloneTrainingPlan(plan) : cloneTrainingPlan(state.trainingPlan);
          const normalizedName = name.trim() || planToSave.title;
          const nextPreset: TrainingPreset = {
            id: createTrainingPresetId(normalizedName),
            name: normalizedName,
            savedAt: new Date().toISOString(),
            source,
            plan: planToSave,
          };

          const existingIndex = state.trainingPresets.findIndex(
            (candidate) => candidate.name.trim().toLocaleLowerCase('pt-BR') === normalizedName.trim().toLocaleLowerCase('pt-BR')
          );
          const nextPresets = [...state.trainingPresets];

          if (existingIndex >= 0) {
            nextPresets[existingIndex] = {
              ...nextPresets[existingIndex],
              ...nextPreset,
            };
          } else {
            nextPresets.unshift(nextPreset);
          }

          return {
            trainingPresets: nextPresets.slice(0, 12),
          };
        });
      },

      savePendingTrainingAsPreset: (name) => {
        set((state) => {
          if (!state.pendingTrainingPlan) {
            return state;
          }

          const presetName = name?.trim() || state.pendingTrainingPlan.suggestedPresetName || state.pendingTrainingPlan.title;
          const nextPreset: TrainingPreset = {
            id: createTrainingPresetId(presetName),
            name: presetName,
            savedAt: new Date().toISOString(),
            source: 'anri',
            plan: {
              title: state.pendingTrainingPlan.title,
              focus: state.pendingTrainingPlan.focus,
              rationale: state.pendingTrainingPlan.rationale,
              appliesToToday: state.pendingTrainingPlan.appliesToToday,
              drills: state.pendingTrainingPlan.drills.map(cloneTrainingDrill),
              source: state.pendingTrainingPlan.source,
              updatedAt: new Date().toISOString(),
            },
          };

          const existingIndex = state.trainingPresets.findIndex(
            (candidate) => candidate.name.trim().toLocaleLowerCase('pt-BR') === presetName.trim().toLocaleLowerCase('pt-BR')
          );
          const nextPresets = [...state.trainingPresets];

          if (existingIndex >= 0) {
            nextPresets[existingIndex] = {
              ...nextPresets[existingIndex],
              ...nextPreset,
            };
          } else {
            nextPresets.unshift(nextPreset);
          }

          return {
            trainingPresets: nextPresets.slice(0, 12),
          };
        });
      },

      activateTrainingPreset: (presetId) => {
        set((state) => {
          const preset = state.trainingPresets.find((candidate) => candidate.id === presetId);
          if (!preset) {
            return state;
          }

          return {
            trainingPlan: {
              ...cloneTrainingPlan(preset.plan),
              source: 'anri',
              updatedAt: new Date().toISOString(),
            },
            pendingTrainingPlan: null,
          };
        });
      },

      removeTrainingPreset: (presetId) => {
        set((state) => ({
          trainingPresets: state.trainingPresets.filter((preset) => preset.id !== presetId),
        }));
      },

      resetContent: () => {
        set({
          ownerUid: null,
          wikiEntries: DEFAULT_WIKI_ENTRIES,
          trainingPlan: createDefaultTrainingPlan(),
          pendingTrainingPlan: null,
          trainingPresets: [],
        });
      },
    }),
    {
      name: 'bluelock-content-storage-v1',
    }
  )
);
