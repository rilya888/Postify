/**
 * Post tone options for Enterprise plan.
 * null = no tone (only Brand Voice). UI "Neutral (default)" submits null.
 */

import type { Platform } from "./platforms";

export const POST_TONE_OPTIONS = [
  {
    id: "professional" as const,
    labelKey: "postTone.professional",
    descriptionKey: "postTone.professionalDescription",
    icon: "💼",
    category: "business" as const,
    recommendedPlatforms: ["linkedin", "email"] as Platform[],
    useCases: ["B2B content", "Thought leadership", "Industry insights"],
    platformNotes: {
      twitter: "May feel too formal for Twitter audience",
    } as Partial<Record<Platform, string>>,
  },
  {
    id: "friendly" as const,
    labelKey: "postTone.friendly",
    descriptionKey: "postTone.friendlyDescription",
    icon: "😊",
    category: "general" as const,
    recommendedPlatforms: ["linkedin", "twitter", "email", "instagram", "facebook"] as Platform[],
    useCases: ["Community building", "Customer engagement", "Behind-the-scenes"],
  },
  {
    id: "sassy" as const,
    labelKey: "postTone.sassy",
    descriptionKey: "postTone.sassyDescription",
    icon: "😏",
    category: "bold" as const,
    recommendedPlatforms: ["twitter"] as Platform[],
    useCases: ["Hot takes", "Brand personality", "Viral content"],
    platformNotes: {
      linkedin: "Use with caution - may not fit professional context",
      email: "Risk: may alienate conservative audiences",
    } as Partial<Record<Platform, string>>,
    warning: "Bold tone - review carefully before posting",
  },
  {
    id: "polite" as const,
    labelKey: "postTone.polite",
    descriptionKey: "postTone.politeDescription",
    icon: "🙏",
    category: "gentle" as const,
    recommendedPlatforms: ["linkedin", "email"] as Platform[],
    useCases: ["Apologies", "Requests", "Customer service"],
  },
  {
    id: "authoritative" as const,
    labelKey: "postTone.authoritative",
    descriptionKey: "postTone.authoritativeDescription",
    icon: "🎯",
    category: "business" as const,
    recommendedPlatforms: ["linkedin"] as Platform[],
    useCases: ["Expert content", "Industry reports", "Data-driven posts"],
  },
  {
    id: "witty" as const,
    labelKey: "postTone.witty",
    descriptionKey: "postTone.wittyDescription",
    icon: "🤓",
    category: "creative" as const,
    recommendedPlatforms: ["twitter", "linkedin"] as Platform[],
    useCases: ["Commentary", "Pop culture refs", "Clever takes"],
  },
  {
    id: "inspirational" as const,
    labelKey: "postTone.inspirational",
    descriptionKey: "postTone.inspirationalDescription",
    icon: "✨",
    category: "emotional" as const,
    recommendedPlatforms: ["linkedin", "email", "instagram"] as Platform[],
    useCases: ["Motivational content", "Success stories", "Vision posts"],
  },
  {
    id: "casual" as const,
    labelKey: "postTone.casual",
    descriptionKey: "postTone.casualDescription",
    icon: "👋",
    category: "general" as const,
    recommendedPlatforms: ["twitter", "email", "tiktok", "instagram"] as Platform[],
    useCases: ["Updates", "Quick shares", "Conversational posts"],
  },
  {
    id: "urgent" as const,
    labelKey: "postTone.urgent",
    descriptionKey: "postTone.urgentDescription",
    icon: "🚨",
    category: "action" as const,
    recommendedPlatforms: ["twitter", "email"] as Platform[],
    useCases: ["Breaking news", "Limited offers", "Immediate action needed"],
  },
] as const;

export type PostToneId = (typeof POST_TONE_OPTIONS)[number]["id"];

export type PostToneCategory =
  | "general"
  | "business"
  | "bold"
  | "gentle"
  | "creative"
  | "emotional"
  | "action";

const TONE_IDS = POST_TONE_OPTIONS.map((t) => t.id);

/** Valid tone ids that can be stored in DB (excludes "neutral" - UI only, maps to null). Tuple for z.enum. */
export const STORABLE_TONE_IDS = [
  "professional",
  "friendly",
  "sassy",
  "polite",
  "authoritative",
  "witty",
  "inspirational",
  "casual",
  "urgent",
] as const;

/**
 * Get AI prompt instruction for a specific tone.
 * Returns empty string for neutral, null, or unknown id (defensive).
 */
export function getTonePromptInstruction(toneId: PostToneId | string | null | undefined): string {
  if (!toneId || toneId === "neutral") return "";
  const instructions: Record<string, string> = {
    professional: `TONE: Professional and authoritative
- Use industry-standard terminology
- Maintain formal but approachable language
- Focus on expertise and credibility
- Avoid slang, emojis, or casual phrases
- Structure: clear, logical, well-organized`,

    friendly: `TONE: Friendly and conversational
- Write like talking to a colleague over coffee
- Use "you" and "we" language
- Include light humor where appropriate
- Emojis are acceptable (1-2 max)
- Keep it warm but professional`,

    sassy: `TONE: Bold and sassy
- Sharp, witty, and memorable
- Don't be afraid to challenge conventional thinking
- Use punchy, short sentences
- Personality > politeness
- Can include relevant emojis (2-3 max)
- Edge is good, offensive is not`,

    polite: `TONE: Polite and respectful
- Extra courteous language ("please", "thank you")
- Acknowledge reader's perspective
- Soften statements with phrases like "perhaps", "might consider"
- No aggressive or pushy language
- Gracious even when disagreeing`,

    authoritative: `TONE: Authoritative and expert
- State facts with confidence
- Reference data, research, or experience
- Use definitive language: "is", "will", "must"
- Minimize hedging words: "maybe", "might", "perhaps"
- Position as the expert in this topic`,

    witty: `TONE: Witty and clever
- Use wordplay, puns, or clever observations
- Reference pop culture when relevant
- Make the reader smile or think
- Smart humor > obvious jokes
- Don't sacrifice clarity for cleverness`,

    inspirational: `TONE: Inspirational and uplifting
- Focus on possibilities and potential
- Use aspirational language
- Include motivational elements
- Paint a vision of success
- Empower the reader
- Positive framing throughout`,

    casual: `TONE: Casual and laid-back
- Write like texting a friend
- Contractions are your friend (it's, you're, we'll)
- Short sentences, easy reading
- Skip the formality
- Conversational flow over structure`,

    urgent: `TONE: Urgent and action-oriented
- Create sense of importance/timeliness
- Use action verbs and imperative mood
- Short, punchy sentences
- Clear call-to-action
- Time-sensitive language: "now", "today", "don't miss"
- Build momentum throughout`,
  };
  return instructions[toneId] ?? "";
}

/** Get tone by ID with metadata */
export function getToneById(id: PostToneId | string): (typeof POST_TONE_OPTIONS)[number] | undefined {
  return POST_TONE_OPTIONS.find((tone) => tone.id === id);
}

/** Get tones by category */
export function getTonesByCategory(category: PostToneCategory) {
  return POST_TONE_OPTIONS.filter((tone) => tone.category === category);
}

/** Check if tone is recommended for platform */
export function isToneRecommendedForPlatform(toneId: PostToneId | string, platform: Platform): boolean {
  const tone = getToneById(toneId);
  return tone?.recommendedPlatforms.includes(platform) ?? false;
}

/** Get platform-specific warning for tone */
export function getTonePlatformWarning(toneId: PostToneId | string, platform: Platform): string | undefined {
  const tone = getToneById(toneId);
  return tone && "platformNotes" in tone ? (tone.platformNotes as Partial<Record<Platform, string>>)?.[platform] : undefined;
}

/** Check if string is a valid storable tone id */
export function isValidToneId(value: string | null | undefined): value is PostToneId {
  return value != null && TONE_IDS.includes(value as PostToneId);
}
