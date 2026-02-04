/**
 * Editor utilities for the content repurposing tool
 */

import { Platform } from "@/lib/constants/platforms";
import { PLATFORM_CHARACTER_LIMITS } from "@/lib/constants/editor";
import { CharacterCountInfo } from "@/types/editor";

/**
 * Calculate character count information for a platform
 */
export function getCharacterCountInfo(content: string, platform: Platform): CharacterCountInfo {
  const current = content.length;
  const max = PLATFORM_CHARACTER_LIMITS[platform];
  const isValid = current <= max;
  
  let warning: string | undefined;
  if (!isValid) {
    warning = `Character limit exceeded: ${current}/${max}`;
  } else if (current > max * 0.9) { // Show warning at 90% of limit
    warning = `Approaching character limit: ${current}/${max}`;
  }
  
  return {
    current,
    max,
    platform,
    isValid,
    warning,
  };
}

/**
 * Format content for a specific platform
 */
export function formatContentForPlatform(content: string, _platform: Platform): string {
  // For now, just return the content as is
  // In the future, we could add platform-specific formatting
  return content;
}

/** Re-export: single source of truth for sanitization (content-validation). */
export { sanitizeContent } from "@/lib/utils/content-validation";