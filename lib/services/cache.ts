import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";


/**
 * Generate a hash key for cache entries
 */
export function generateCacheKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
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