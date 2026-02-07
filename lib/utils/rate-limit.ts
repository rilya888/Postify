/**
 * Simple in-memory rate limiter for API routes.
 * Uses per-user (userId) limits within a time window.
 * Note: In serverless, this is per-instance; for cross-instance limits use Redis or similar.
 */

import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import type { Plan } from "@/lib/constants/plans";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 generate requests per minute per user
const OUTPUT_UPDATE_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_OUTPUT_UPDATES_PER_WINDOW = 30; // 30 output updates per minute per user
const PROJECTS_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PROJECTS_REQUESTS_PER_WINDOW = 60; // 60 project API requests per minute per user

const TRANSCRIBE_WINDOW_MS = 3600 * 1000; // 1 hour
const CONTENT_PACK_WINDOW_MS = 60 * 1000; // 1 minute
const DOCUMENT_PARSE_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_DOCUMENT_PARSE_PER_WINDOW = 30; // 30 document parse requests per minute per user

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const outputUpdateStore = new Map<string, Entry>();
const projectsStore = new Map<string, Entry>();
const transcribeStore = new Map<string, Entry>();
const contentPackStore = new Map<string, Entry>();
const documentParseStore = new Map<string, Entry>();

function getOrCreateEntry(userId: string, map: Map<string, Entry>, windowMs: number): Entry {
  const now = Date.now();
  const entry = map.get(userId);
  if (!entry || now >= entry.resetAt) {
    const newEntry: Entry = { count: 0, resetAt: now + windowMs };
    map.set(userId, newEntry);
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
  const entry = getOrCreateEntry(userId, store, WINDOW_MS);
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

/**
 * Check if the user has exceeded the output update rate limit.
 * Call before PATCH /api/outputs/[id].
 */
export function checkOutputUpdateRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = getOrCreateEntry(userId, outputUpdateStore, OUTPUT_UPDATE_WINDOW_MS);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + OUTPUT_UPDATE_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > MAX_OUTPUT_UPDATES_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

/**
 * Check if the user has exceeded the projects API rate limit.
 * Call before GET/POST /api/projects and GET/PATCH/DELETE /api/projects/[id], POST /api/projects/bulk-delete.
 */
export function checkProjectsRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = getOrCreateEntry(userId, projectsStore, PROJECTS_WINDOW_MS);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + PROJECTS_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > MAX_PROJECTS_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

/**
 * Check transcribe rate limit (per plan profile from RATE_LIMITS).
 */
export function checkTranscribeRateLimit(
  userId: string,
  plan: Plan
): { allowed: boolean; retryAfterSeconds?: number } {
  const limits = RATE_LIMITS[plan] ?? RATE_LIMITS.free;
  const entry = getOrCreateEntry(userId, transcribeStore, TRANSCRIBE_WINDOW_MS);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + TRANSCRIBE_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > limits.transcribe.points) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

/**
 * Check content-pack rate limit (per plan profile from RATE_LIMITS).
 */
export function checkContentPackRateLimit(
  userId: string,
  plan: Plan
): { allowed: boolean; retryAfterSeconds?: number } {
  const limits = RATE_LIMITS[plan] ?? RATE_LIMITS.free;
  const entry = getOrCreateEntry(userId, contentPackStore, CONTENT_PACK_WINDOW_MS);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + CONTENT_PACK_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > limits.contentPack.points) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

/**
 * Check document parse rate limit (POST /api/documents/parse).
 * 30 requests per minute per user to prevent abuse.
 */
export function checkDocumentParseRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = getOrCreateEntry(userId, documentParseStore, DOCUMENT_PARSE_WINDOW_MS);
  const now = Date.now();
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + DOCUMENT_PARSE_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > MAX_DOCUMENT_PARSE_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}
