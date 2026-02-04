/**
 * Content Pack service: build structured JSON from source text (one call per source).
 * Used for generation from pack instead of full text (Stage 2).
 */

import { prisma } from "@/lib/db/prisma";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { generateCacheKey, getCachedValue, setCachedValue, CACHE_TTL, buildGenerationCacheKey } from "@/lib/services/cache";
import { getModelConfig } from "@/lib/constants/ai-models";
import type { Plan } from "@/lib/constants/plans";

/** Content Pack JSON shape (per plan) */
export type ContentPackData = {
  summary_short: string;
  summary_long: string;
  key_points: string[];
  audience: string;
  tone_suggestions: string;
  quotes: string[];
  cta_options: string[];
  hashtags?: string[];
  compliance_notes?: string;
  sections?: { title: string; summary: string }[];
  faq?: { question: string; answer: string }[];
};

const CONTENT_PACK_SYSTEM = `You are a content analyst. Output ONLY valid JSON, no markdown, no explanation.
Required keys: summary_short (5-7 lines), summary_long (12-20 lines), key_points (array 10-25 items), audience, tone_suggestions, quotes (array 5-15), cta_options (array 3-8).
Optional: hashtags (array), compliance_notes (string), sections (array of {title, summary}), faq (array of {question, answer}).`;

const CONTENT_PACK_USER = (text: string, language?: string) =>
  `Analyze the following content and produce a content pack JSON.${language ? ` Content language: ${language}.` : ""}

Content:
${text.slice(0, 30000)}

Return only the JSON object.`;

/**
 * Build Content Pack from raw text via one OpenAI call (strict JSON).
 * Uses config from ai-models by plan (default free).
 */
export async function buildContentPackFromText(
  text: string,
  options?: { language?: string; model?: string; plan?: Plan }
): Promise<ContentPackData> {
  const plan = options?.plan ?? "free";
  const config = getModelConfig(plan).contentPack;
  const model = options?.model ?? config.model;
  const client = getOpenAIClient();
  const userMessage = CONTENT_PACK_USER(text, options?.language);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: CONTENT_PACK_SYSTEM },
      { role: "user", content: userMessage },
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(jsonStr) as ContentPackData;

  if (!parsed.summary_short || !parsed.key_points || !Array.isArray(parsed.key_points)) {
    throw new Error("Invalid Content Pack: missing required fields");
  }
  if (!parsed.quotes) parsed.quotes = [];
  if (!parsed.cta_options) parsed.cta_options = [];
  return parsed;
}

/**
 * Get existing Content Pack by projectId + inputHash, or create and save one.
 * Uses DB and cache (deterministic key from userId, projectId, inputHash, options).
 */
export async function getOrCreateContentPack(
  projectId: string,
  userId: string,
  sourceContent: string,
  options?: { language?: string; model?: string; brandVoiceId?: string; brandVoiceUpdatedAt?: string; plan?: Plan }
): Promise<ContentPackData> {
  const plan = options?.plan ?? "free";
  const packConfig = getModelConfig(plan).contentPack;
  const inputHash = generateCacheKey(sourceContent + JSON.stringify(options?.language ?? ""));
  const optionsHash = generateCacheKey(JSON.stringify({ language: options?.language, model: options?.model }));
  const cacheKey = buildGenerationCacheKey({
    userId,
    projectId,
    step: "content_pack",
    model: options?.model ?? packConfig.model,
    platform: "",
    inputHash,
    optionsHash,
    brandVoiceId: options?.brandVoiceId ?? null,
    brandVoiceUpdatedAt: options?.brandVoiceUpdatedAt ?? null,
  });

  const cached = await getCachedValue(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as ContentPackData;
    } catch {
      // ignore bad cache
    }
  }

  const existing = await prisma.contentPack.findFirst({
    where: { projectId, inputHash },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.packJson && typeof existing.packJson === "object") {
    const pack = existing.packJson as ContentPackData;
    await setCachedValue(cacheKey, JSON.stringify(pack), CACHE_TTL.CONTENT_PACK_SECONDS);
    return pack;
  }

  const pack = await buildContentPackFromText(sourceContent, {
    language: options?.language,
    model: options?.model ?? packConfig.model,
    plan,
  });

  await prisma.contentPack.create({
    data: {
      projectId,
      userId,
      packJson: pack as object,
      inputHash,
      model: options?.model ?? packConfig.model,
    },
  });

  await setCachedValue(cacheKey, JSON.stringify(pack), CACHE_TTL.CONTENT_PACK_SECONDS);
  return pack;
}

/**
 * Serialize Content Pack for use in platform prompts (compact string).
 */
export function formatContentPackForPrompt(pack: ContentPackData): string {
  const parts: string[] = [
    `Summary (short): ${pack.summary_short}`,
    `Summary (long): ${pack.summary_long}`,
    `Key points: ${(pack.key_points || []).join("; ")}`,
    `Audience: ${pack.audience ?? ""}`,
    `Tone: ${pack.tone_suggestions ?? ""}`,
    `Quotes: ${(pack.quotes || []).slice(0, 8).join(" | ")}`,
    `CTAs: ${(pack.cta_options || []).join("; ")}`,
  ];
  if (pack.hashtags?.length) parts.push(`Hashtags: ${pack.hashtags.join(", ")}`);
  if (pack.compliance_notes) parts.push(`Compliance: ${pack.compliance_notes}`);
  return parts.join("\n");
}
