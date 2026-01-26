/**
 * Platform constants
 * Used in Stage 3 for AI generation
 */

export type Platform = "linkedin" | "twitter" | "email";

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
