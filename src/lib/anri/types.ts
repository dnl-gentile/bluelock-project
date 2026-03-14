import type { TrainingDrill, WikiEntry } from '@lib/bluelock-content';
import type { DrillType, SkillTier, SkillType, WikiCategoryId } from '@lib/bluelock-taxonomy';

export interface AnriMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface AnriAthleteSkillContext {
  id: string;
  name: string;
  type: SkillType;
  tier?: SkillTier;
  requiredXp?: number;
  description?: string;
  createdBy?: 'system' | 'anri';
  linkedWikiEntryTitle?: string | null;
  dependencyIds?: string[];
  unlocked: boolean;
  dependencyNames?: string[];
}

export interface AnriTrainingHistoryItem {
  type: string;
  xpEarned: number;
  date: string;
}

export interface AnriAthleteContext {
  xp: number;
  rank: string;
  unlockedSkills: AnriAthleteSkillContext[];
  lockedSkillCount: number;
  recentHistory: AnriTrainingHistoryItem[];
}

export interface AnriRequest {
  messages: AnriMessage[];
  chatMessages?: AnriChatMessage[];
  pendingAiMessageId?: string;
  athlete: AnriAthleteContext;
  wikiEntries?: WikiEntry[];
  currentTraining?: TrainingDrill[];
  currentTrainingPlan?: {
    title: string;
    focus: string;
    rationale: string;
    appliesToToday: boolean;
    drills: TrainingDrill[];
  };
  skillTree?: AnriAthleteSkillContext[];
}

export interface SuggestedWikiEntry {
  category: WikiCategoryId;
  title: string;
  text: string;
  reason: string;
  relatedDrillTitle: string | null;
}

export interface SuggestedTrainingDrill {
  title: string;
  type: DrillType;
  description: string;
  topics: string[];
  sourceWikiTitles: string[];
  isNew: boolean;
}

export interface SuggestedTrainingPlan {
  title: string;
  focus: string;
  rationale: string;
  appliesToToday: boolean;
  drills: SuggestedTrainingDrill[];
}

export interface SuggestedSkillTreeEntry {
  name: string;
  description: string;
  type: SkillType;
  tier: SkillTier;
  requiredXp: number;
  wikiTitle: string;
  dependencyTitles: string[];
  reason: string;
  isPrerequisite: boolean;
}

export interface AnriExecutionPlan {
  intent: 'general_guidance' | 'training_adjustment' | 'wiki_creation' | 'hybrid';
  rationale: string;
  responseBrief: string;
  priorities: string[];
  trainingPlan: SuggestedTrainingPlan | null;
  wikiEntries: SuggestedWikiEntry[];
  skillTreeEntries: SuggestedSkillTreeEntry[];
}

export interface AnriVoiceLayer {
  reply: string;
  suggestedNextPrompts: string[];
}

export interface AnriChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  response?: AnriResponsePayload;
}

export interface AnriResponsePayload {
  intent: 'general_guidance' | 'training_adjustment' | 'wiki_creation' | 'hybrid';
  reply: string;
  rationale: string;
  suggestedNextPrompts: string[];
  trainingPlan: SuggestedTrainingPlan | null;
  wikiEntries: SuggestedWikiEntry[];
  skillTreeEntries: SuggestedSkillTreeEntry[];
}
