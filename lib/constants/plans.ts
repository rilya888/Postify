/**
 * Plan limits for different subscription tiers
 */
export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxOutputsPerProject: 1,
    maxCharactersPerContent: 10000,
    maxVariationsPerGeneration: 3,
  },
  pro: {
    maxProjects: 50,
    maxOutputsPerProject: 5,
    maxCharactersPerContent: 5000,
    maxVariationsPerGeneration: 5,
  },
  enterprise: {
    maxProjects: 500,
    maxOutputsPerProject: 10,
    maxCharactersPerContent: 10000,
    maxVariationsPerGeneration: 10,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;