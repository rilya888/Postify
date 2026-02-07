/**
 * Rate limits per plan (trial, free, pro, max, enterprise).
 * transcribe: points per duration (e.g. per hour).
 * contentPack: points per minute.
 */

import type { Plan } from "@/lib/constants/plans";

export const RATE_LIMITS: Record<Plan, { transcribe: { points: number; durationSeconds: number }; contentPack: { points: number; durationSeconds: number } }> = {
  trial: {
    transcribe: { points: 10, durationSeconds: 3600 },
    contentPack: { points: 50, durationSeconds: 60 },
  },
  free: {
    transcribe: { points: 2, durationSeconds: 3600 },
    contentPack: { points: 10, durationSeconds: 60 },
  },
  pro: {
    transcribe: { points: 10, durationSeconds: 3600 },
    contentPack: { points: 50, durationSeconds: 60 },
  },
  max: {
    transcribe: { points: 25, durationSeconds: 3600 },
    contentPack: { points: 100, durationSeconds: 60 },
  },
  enterprise: {
    transcribe: { points: 50, durationSeconds: 3600 },
    contentPack: { points: 200, durationSeconds: 60 },
  },
};
