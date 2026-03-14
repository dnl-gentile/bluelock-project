import type { SuggestedSkillTreeEntry, SuggestedTrainingPlan, SuggestedWikiEntry } from '@lib/anri/types';
import type { TrainingDrill, WikiEntry } from '@lib/bluelock-content';
import type { WikiCategoryId } from '@lib/bluelock-taxonomy';
import { createSkillId, type Skill } from '@lib/ego-domain';

const TIER_XP_FLOOR = {
  1: 0,
  2: 500,
  3: 2500,
  4: 6000,
  5: 12000,
} as const;

function normalizeLabel(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNextDrillId(drills: TrainingDrill[]) {
  return drills.reduce((highestId, drill) => Math.max(highestId, drill.id), 0) + 1;
}

function getDrillEmoji(type: TrainingDrill['type']) {
  switch (type) {
    case 'chute':
      return '🔥';
    case 'drible':
      return '👻';
    case 'velocidade':
      return '⚡️';
    case 'mentalidade':
      return '🧠';
    case 'passe':
      return '🎯';
    case 'resistencia':
      return '💨';
    default:
      return '⚽️';
  }
}

export function mergeWikiEntryRecords(
  source: Record<WikiCategoryId, WikiEntry[]>,
  entries: Array<Omit<WikiEntry, 'id'> & { id: string }>
) {
  const nextEntries = { ...source };

  for (const entry of entries) {
    const category = entry.category;
    const current = [...(nextEntries[category] ?? [])];
    const incomingTitle = normalizeLabel(entry.title);
    const existingIndex = current.findIndex(
      (candidate) => normalizeLabel(candidate.title) === incomingTitle
    );

    if (existingIndex >= 0) {
      current[existingIndex] = {
        ...current[existingIndex],
        ...entry,
      };
    } else {
      current.unshift(entry);
    }

    nextEntries[category] = current;
  }

  return nextEntries;
}

export function groupWikiEntries(entries: WikiEntry[]) {
  return entries.reduce<Record<WikiCategoryId, WikiEntry[]>>((accumulator, entry) => {
    const bucket = accumulator[entry.category] ?? [];
    accumulator[entry.category] = [...bucket, entry];
    return accumulator;
  }, {
    chute: [],
    velocidade: [],
    drible: [],
    tatica: [],
    passe: [],
    resistencia: [],
  });
}

export function materializeWikiEntries(entries: SuggestedWikiEntry[]): Array<Omit<WikiEntry, 'id'> & { id: string }> {
  return entries.map((entry) => ({
    id: `wiki-${entry.category}-${slugify(entry.title)}`,
    category: entry.category,
    title: entry.title,
    text: entry.text,
    drillId: null,
  }));
}

export function materializeTrainingPlan(
  plan: SuggestedTrainingPlan,
  existingDrills: TrainingDrill[]
) {
  let nextDrillId = getNextDrillId(existingDrills);

  return {
    title: plan.title,
    focus: plan.focus,
    rationale: plan.rationale,
    appliesToToday: plan.appliesToToday,
    drills: plan.drills.map((drill) => {
      const reusedDrill = existingDrills.find(
        (candidate) => normalizeLabel(candidate.title) === normalizeLabel(drill.title)
      );

      if (reusedDrill) {
        return {
          ...reusedDrill,
          description: drill.description,
          topics: drill.topics,
          type: drill.type,
        };
      }

      const materializedDrill: TrainingDrill = {
        id: nextDrillId,
        title: drill.title,
        emoji: getDrillEmoji(drill.type),
        type: drill.type,
        description: drill.description,
        topics: drill.topics,
        videoUrl: 'placeholder',
      };

      nextDrillId += 1;
      return materializedDrill;
    }),
  };
}

export function materializeSkillTreeEntries(
  suggestions: SuggestedSkillTreeEntry[],
  currentSkills: Skill[]
): Skill[] {
  const existingByName = new Map(currentSkills.map((skill) => [normalizeLabel(skill.name), skill]));
  const orderedSuggestions = [...suggestions].sort((left, right) => {
    if (left.isPrerequisite !== right.isPrerequisite) {
      return left.isPrerequisite ? -1 : 1;
    }
    if (left.tier !== right.tier) {
      return left.tier - right.tier;
    }
    return left.name.localeCompare(right.name, 'pt-BR');
  });

  const suggestionIds = new Map<string, string>();
  for (const suggestion of orderedSuggestions) {
    const existingSkill = existingByName.get(normalizeLabel(suggestion.name));
    suggestionIds.set(
      normalizeLabel(suggestion.name),
      existingSkill?.id ?? createSkillId(suggestion.type, suggestion.name)
    );
  }

  return orderedSuggestions.map((suggestion) => {
    const existingSkill = existingByName.get(normalizeLabel(suggestion.name));
    const dependencyIds = suggestion.dependencyTitles
      .map((dependencyTitle) => {
        const normalizedDependency = normalizeLabel(dependencyTitle);
        return (
          existingByName.get(normalizedDependency)?.id ??
          suggestionIds.get(normalizedDependency) ??
          null
        );
      })
      .filter((dependencyId): dependencyId is string => Boolean(dependencyId))
      .filter((dependencyId, index, values) => values.indexOf(dependencyId) === index);

    return {
      id: suggestionIds.get(normalizeLabel(suggestion.name)) ?? createSkillId(suggestion.type, suggestion.name),
      name: suggestion.name,
      description: suggestion.description,
      requiredXp: Math.max(TIER_XP_FLOOR[suggestion.tier], suggestion.requiredXp),
      unlocked: existingSkill?.unlocked ?? false,
      type: suggestion.type,
      dependencies: dependencyIds.filter((dependencyId) => dependencyId !== existingSkill?.id),
      tier: suggestion.tier,
      createdBy: existingSkill?.createdBy ?? 'anri',
      linkedWikiEntryTitle: suggestion.wikiTitle,
    } satisfies Skill;
  });
}

export function mergeSkillCollections(
  currentSkills: Skill[],
  incomingSkills: Skill[],
  athleteXp: number
) {
  const mergedSkills = [...currentSkills];

  for (const incomingSkill of incomingSkills) {
    const existingIndex = mergedSkills.findIndex(
      (candidate) =>
        candidate.id === incomingSkill.id || normalizeLabel(candidate.name) === normalizeLabel(incomingSkill.name)
    );

    const normalizedSkill: Skill = {
      ...incomingSkill,
      dependencies: [...new Set(incomingSkill.dependencies)],
      unlocked: incomingSkill.unlocked || athleteXp >= incomingSkill.requiredXp,
      createdBy: incomingSkill.createdBy ?? 'anri',
      linkedWikiEntryTitle: incomingSkill.linkedWikiEntryTitle ?? null,
    };

    if (existingIndex >= 0) {
      const existingSkill = mergedSkills[existingIndex];
      mergedSkills[existingIndex] = {
        ...existingSkill,
        ...normalizedSkill,
        dependencies: [...new Set([...existingSkill.dependencies, ...normalizedSkill.dependencies])],
        unlocked: existingSkill.unlocked || normalizedSkill.unlocked || athleteXp >= normalizedSkill.requiredXp,
      };
    } else {
      mergedSkills.push(normalizedSkill);
    }
  }

  return mergedSkills.sort((left, right) => {
    const typeDelta = left.type.localeCompare(right.type, 'pt-BR');
    if (typeDelta !== 0) return typeDelta;
    if (left.tier !== right.tier) return left.tier - right.tier;
    if (left.requiredXp !== right.requiredXp) return left.requiredXp - right.requiredXp;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}
