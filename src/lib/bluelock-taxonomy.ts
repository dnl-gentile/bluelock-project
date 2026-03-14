export type SkillType =
  | 'chute'
  | 'drible'
  | 'velocidade'
  | 'mentalidade'
  | 'passe'
  | 'resistencia';

export type DrillType = SkillType;
export type SkillTier = 1 | 2 | 3 | 4 | 5;
export type WikiCategoryId = 'chute' | 'velocidade' | 'drible' | 'tatica' | 'passe' | 'resistencia';

export const SKILL_TYPE_TO_WIKI_CATEGORY: Record<SkillType, WikiCategoryId> = {
  chute: 'chute',
  drible: 'drible',
  velocidade: 'velocidade',
  mentalidade: 'tatica',
  passe: 'passe',
  resistencia: 'resistencia',
};

export const WIKI_CATEGORY_TO_SKILL_TYPE: Record<WikiCategoryId, SkillType> = {
  chute: 'chute',
  velocidade: 'velocidade',
  drible: 'drible',
  tatica: 'mentalidade',
  passe: 'passe',
  resistencia: 'resistencia',
};

export function wikiCategoryToSkillType(category: WikiCategoryId): SkillType {
  return WIKI_CATEGORY_TO_SKILL_TYPE[category];
}

export function skillTypeToWikiCategory(type: SkillType): WikiCategoryId {
  return SKILL_TYPE_TO_WIKI_CATEGORY[type];
}
