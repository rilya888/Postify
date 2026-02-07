import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

/** TTL in seconds: Content Pack 7–30 days, Outputs 7 days (per plan) */
export const CACHE_TTL = {
  OUTPUTS_SECONDS: 7 * 24 * 3600,
  CONTENT_PACK_SECONDS: 7 * 24 * 3600,
} as const;

/**
 * Generate a hash key for cache entries
 */
export function generateCacheKey(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const GENERATION_KEY_PREFIX = "gen_";

/**
 * Build deterministic cache key for generation (no Date.now()).
 * Key = gen_${projectId}_ + sha256(...) so project cache can be invalidated.
 * Include seriesIndex and seriesTotal so series posts do not share cache.
 */
export function buildGenerationCacheKey(params: {
  userId: string;
  projectId: string;
  step: string;
  model: string;
  platform: string;
  inputHash: string;
  optionsHash: string;
  brandVoiceId: string | null;
  brandVoiceUpdatedAt: string | null;
  postTone?: string | null;
  seriesIndex?: number;
  seriesTotal?: number;
}): string {
  const parts = [
    params.userId,
    params.projectId,
    params.step,
    params.model,
    params.platform,
    params.inputHash,
    params.optionsHash,
    params.brandVoiceId ?? "",
    params.brandVoiceUpdatedAt ?? "",
    params.postTone ?? "neutral",
    String(params.seriesIndex ?? 1),
    String(params.seriesTotal ?? 1),
  ].join("|");
  return `${GENERATION_KEY_PREFIX}${params.projectId}_${generateCacheKey(parts)}`;
}

/**
 * Invalidate all generation and content-pack cache entries for a project.
 * Call when project.sourceContent (or brand voice used by this project) changes.
 */
export async function invalidateProjectGenerationCache(projectId: string): Promise<number> {
  try {
    const prefix = `${GENERATION_KEY_PREFIX}${projectId}_`;
    const entries = await prisma.cache.findMany({
      where: { key: { startsWith: prefix } },
      select: { key: true },
    });
    for (const { key } of entries) {
      await prisma.cache.delete({ where: { key } });
    }
    return entries.length;
  } catch (error) {
    console.error("Error invalidating project cache:", error);
    return 0;
  }
}

/**
 * Get cached value by key
 */
export async function getCachedValue(key: string): Promise<string | null> {
  try {
    const cacheEntry = await prisma.cache.findUnique({
      where: { key },
    });

    if (!cacheEntry) {
      return null;
    }

    // Check if the entry has expired
    if (new Date() > cacheEntry.expiresAt) {
      // Entry has expired, delete it and return null
      await prisma.cache.delete({
        where: { key },
      });
      return null;
    }

    return cacheEntry.value;
  } catch (error) {
    console.error("Error getting cached value:", error);
    return null;
  }
}

/**
 * Set cached value with expiration
 */
export async function setCachedValue(key: string, value: string, ttlInSeconds: number = 3600): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttlInSeconds * 1000);

    await prisma.cache.upsert({
      where: { key },
      update: {
        value,
        expiresAt,
      },
      create: {
        key,
        value,
        expiresAt,
      },
    });

    return true;
  } catch (error) {
    console.error("Error setting cached value:", error);
    return false;
  }
}

/**
 * Delete cached value by key
 */
export async function deleteCachedValue(key: string): Promise<boolean> {
  try {
    await prisma.cache.delete({
      where: { key },
    });

    return true;
  } catch (error) {
    console.error("Error deleting cached value:", error);
    return false;
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const result = await prisma.cache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error cleaning expired cache:", error);
    return 0;
  }
}

/**
 * Delete all cache entries. Admin only.
 */
export async function cleanAllCache(): Promise<number> {
  try {
    const result = await prisma.cache.deleteMany({});
    return result.count;
  } catch (error) {
    console.error("Error cleaning all cache:", error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ total: number; expired: number; sizeEstimate: number }> {
  try {
    const totalEntries = await prisma.cache.count();
    
    const expiredEntries = await prisma.cache.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Estimate size by summing the lengths of all values (this is approximate)
    const allEntries = await prisma.cache.findMany({
      select: {
        value: true,
      },
    });
    
    const sizeEstimate = allEntries.reduce((sum, entry) => sum + (entry.value?.length || 0), 0);

    return {
      total: totalEntries,
      expired: expiredEntries,
      sizeEstimate,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { total: 0, expired: 0, sizeEstimate: 0 };
  }
}