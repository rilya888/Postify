/**
 * Platform constants
 * Used in Stage 3 for AI generation
 */

export type Platform = "linkedin" | "twitter" | "email" | "instagram" | "facebook" | "tiktok" | "youtube";

/**
 * Platform configuration with limits and metadata
 */
export const PLATFORMS = {
  linkedin: {
    id: "linkedin" as const,
    name: "LinkedIn",
    icon: "💼",
    maxLength: 3000,
    minLength: 1200,
    description: "Professional networking platform",
  },
  twitter: {
    id: "twitter" as const,
    name: "Twitter/X",
    icon: "🐦",
    maxLength: 280, // Per tweet
    minLength: 50,
    description: "Social media platform",
    supportsThreads: true,
  },
  email: {
    id: "email" as const,
    name: "Email Newsletter",
    icon: "📧",
    maxLength: 1000, // Words
    minLength: 500,
    description: "Email marketing",
  },
  instagram: {
    id: "instagram" as const,
    name: "Instagram",
    icon: "📱",
    maxLength: 2200, // Characters in caption
    minLength: 500,
    description: "Visual social media platform",
    supportsHashtags: true,
    supportsMentions: true,
  },
  facebook: {
    id: "facebook" as const,
    name: "Facebook",
    icon: "📘",
    maxLength: 5000, // Characters in post
    minLength: 50,
    description: "Social networking platform",
    supportsHashtags: true,
    supportsMentions: true,
  },
  tiktok: {
    id: "tiktok" as const,
    name: "TikTok",
    icon: "🎵",
    maxLength: 150, // Characters in caption
    minLength: 10,
    description: "Short-form video platform",
    supportsHashtags: true,
    supportsMentions: true,
  },
  youtube: {
    id: "youtube" as const,
    name: "YouTube",
    icon: "📺",
    maxLength: 5000, // Characters in description
    minLength: 100,
    description: "Video sharing platform",
    supportsHashtags: true,
    supportsMentions: true,
    supportsTimestamps: true,
  },
} as const;

/**
 * Get platform by ID
 */
export function getPlatform(id: Platform) {
  return PLATFORMS[id];
}

/**
 * Get all platform IDs
 */
export function getAllPlatformIds(): Platform[] {
  return Object.keys(PLATFORMS) as Platform[];
}
