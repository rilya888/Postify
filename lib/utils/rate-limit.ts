/**
 * Simple in-memory rate limiter for API routes.
 * Uses per-user (userId) limits within a time window.
 * Note: In serverless, this is per-instance; for cross-instance limits use Redis or similar.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 generate requests per minute per user

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function getOrCreateEntry(userId: string): Entry {
  const now = Date.now();
  const entry = store.get(userId);
  if (!entry || now >= entry.resetAt) {
    const newEntry: Entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(userId, newEntry);
    return newEntry;
  }
  return entry;
}

/**
 * Check if the user has exceeded the rate limit.
 * Call this before processing; it increments the counter.
 * @returns true if allowed, false if rate limited
 */
export function checkGenerateRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = getOrCreateEntry(userId);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}
