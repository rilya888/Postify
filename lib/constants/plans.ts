/**
 * Plan limits for different subscription tiers
 */
export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxOutputsPerProject: 1,
    maxCharactersPerContent: 1000,
  },
  pro: {
    maxProjects: 50,
    maxOutputsPerProject: 5,
    maxCharactersPerContent: 5000,
  },
  enterprise: {
    maxProjects: 500,
    maxOutputsPerProject: 10,
    maxCharactersPerContent: 10000,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;