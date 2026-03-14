import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillType } from '@lib/bluelock-taxonomy';
import {
  cloneSkills,
  createSkillId,
  DEFAULT_SKILLS,
  normalizeSkillName,
  type Skill,
  type SkillAlert,
} from '@lib/ego-domain';
import { calculateAthletePerformanceMetrics, type TrainingLevel } from '@lib/athlete-metrics';

export type Rank = TrainingLevel;
export type { SkillType } from '@lib/bluelock-taxonomy';
export type { Skill, SkillAlert } from '@lib/ego-domain';
export { createSkillId, getSkillAlerts } from '@lib/ego-domain';

export interface TrainingSession {
  id: string;
  date: string;
  type: string;
  xpEarned: number;
}

interface EgoState {
  ownerUid: string | null;
  xp: number;
  rank: Rank;
  skills: Skill[];
  history: TrainingSession[];

  bindOwner: (uid: string | null) => void;
  hydrateFromCloud: (
    payload: Partial<Pick<EgoState, 'xp' | 'rank' | 'skills' | 'history'>>,
    uid: string
  ) => void;
  addXp: (amount: number) => void;
  completeTraining: (session: Omit<TrainingSession, 'id' | 'date'>) => void;
  checkUnlocks: () => void;
  upsertSkills: (skills: Skill[]) => void;
  resetProgress: () => void;
}

const TYPE_ORDER: Record<SkillType, number> = {
  chute: 0,
  velocidade: 1,
  drible: 2,
  mentalidade: 3,
  passe: 4,
  resistencia: 5,
};

function calculateRank(xp: number, skills: Skill[], history: TrainingSession[]): Rank {
  return calculateAthletePerformanceMetrics({
    xp,
    skills,
    history,
  }).level;
}

export const useEgoStore = create<EgoState>()(
  persist(
    (set, get) => ({
      ownerUid: null,
      xp: 0,
      rank: 'Z',
      skills: cloneSkills(DEFAULT_SKILLS),
      history: [],

      bindOwner: (uid) => {
        set((state) => {
          if (state.ownerUid === uid) {
            return state;
          }

          return {
            ownerUid: uid,
            xp: 0,
            rank: 'Z',
            skills: cloneSkills(DEFAULT_SKILLS),
            history: [],
          };
        });
      },

      hydrateFromCloud: (payload, uid) => {
        const hydratedXp = payload.xp ?? 0;
        const hydratedHistory = payload.history ?? [];
        const hydratedSkills = cloneSkills(payload.skills ?? DEFAULT_SKILLS).map((skill) => ({
          ...skill,
          unlocked: skill.unlocked || hydratedXp >= skill.requiredXp,
        }));
        set({
          ownerUid: uid,
          xp: hydratedXp,
          rank: calculateRank(hydratedXp, hydratedSkills, hydratedHistory),
          skills: hydratedSkills,
          history: hydratedHistory,
        });
      },

      addXp: (amount) => {
        set((state) => {
          const newXp = state.xp + amount;
          const newRank = calculateRank(newXp, state.skills, state.history);
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
        
        set((state) => {
          const history = [newSession, ...state.history];
          const xp = state.xp + session.xpEarned;
          return {
            history,
            xp,
            rank: calculateRank(xp, state.skills, history),
          };
        });

        get().checkUnlocks();
      },

      checkUnlocks: () => {
        set((state) => {
          const updatedSkills = state.skills.map((skill) => {
            const isUnlockedNow = skill.unlocked || state.xp >= skill.requiredXp;

            return {
              ...skill,
              unlocked: isUnlockedNow,
            };
          });
          return {
            skills: updatedSkills,
            rank: calculateRank(state.xp, updatedSkills, state.history),
          };
        });
      },

      upsertSkills: (incomingSkills) => {
        set((state) => {
          const mergedSkills = [...state.skills];

          for (const incomingSkill of incomingSkills) {
            const existingIndex = mergedSkills.findIndex(
              (candidate) =>
                candidate.id === incomingSkill.id || normalizeSkillName(candidate.name) === normalizeSkillName(incomingSkill.name)
            );

            const normalizedSkill: Skill = {
              ...incomingSkill,
              id: incomingSkill.id || createSkillId(incomingSkill.type, incomingSkill.name),
              dependencies: [...new Set(incomingSkill.dependencies)],
              linkedWikiEntryTitle: incomingSkill.linkedWikiEntryTitle ?? null,
              unlocked: incomingSkill.unlocked || state.xp >= incomingSkill.requiredXp,
              createdBy: incomingSkill.createdBy ?? 'anri',
            };

            if (existingIndex >= 0) {
              const existingSkill = mergedSkills[existingIndex];
              mergedSkills[existingIndex] = {
                ...existingSkill,
                ...normalizedSkill,
                dependencies: [...new Set([...existingSkill.dependencies, ...normalizedSkill.dependencies])],
                unlocked: existingSkill.unlocked || normalizedSkill.unlocked || state.xp >= normalizedSkill.requiredXp,
              };
            } else {
              mergedSkills.push(normalizedSkill);
            }
          }

          mergedSkills.sort((left, right) => {
            const typeDelta = TYPE_ORDER[left.type] - TYPE_ORDER[right.type];
            if (typeDelta !== 0) return typeDelta;
            if (left.tier !== right.tier) return left.tier - right.tier;
            if (left.requiredXp !== right.requiredXp) return left.requiredXp - right.requiredXp;
            return left.name.localeCompare(right.name, 'pt-BR');
          });

          return {
            skills: mergedSkills,
            rank: calculateRank(state.xp, mergedSkills, state.history),
          };
        });
      },

      resetProgress: () => {
        set({
          ownerUid: null,
          xp: 0,
          rank: 'Z',
          skills: cloneSkills(DEFAULT_SKILLS),
          history: [],
        });
      },
    }),
    {
      name: 'bluelock-ego-storage-v4',
    }
  )
);
