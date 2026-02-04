/**
 * Common prompt templates and utilities.
 * System = short rules. User template = task + placeholders {sourceContent}, {brandVoice}.
 */
import {
  LINKEDIN_SYSTEM_PROMPT,
  LINKEDIN_USER_TEMPLATE,
  LINKEDIN_USER_TEMPLATE_FROM_PACK,
  LINKEDIN_PROMPT_TEMPLATE,
} from "./prompts/linkedin";
import {
  TWITTER_SYSTEM_PROMPT,
  TWITTER_USER_TEMPLATE,
  TWITTER_USER_TEMPLATE_FROM_PACK,
  TWITTER_PROMPT_TEMPLATE,
} from "./prompts/twitter";
import {
  EMAIL_SYSTEM_PROMPT,
  EMAIL_USER_TEMPLATE,
  EMAIL_USER_TEMPLATE_FROM_PACK,
  EMAIL_PROMPT_TEMPLATE,
} from "./prompts/email";
import {
  INSTAGRAM_SYSTEM_PROMPT,
  INSTAGRAM_USER_TEMPLATE,
  INSTAGRAM_USER_TEMPLATE_FROM_PACK,
  INSTAGRAM_PROMPT_TEMPLATE,
} from "./prompts/instagram";
import {
  FACEBOOK_SYSTEM_PROMPT,
  FACEBOOK_USER_TEMPLATE,
  FACEBOOK_USER_TEMPLATE_FROM_PACK,
  FACEBOOK_PROMPT_TEMPLATE,
} from "./prompts/facebook";
import {
  TIKTOK_SYSTEM_PROMPT,
  TIKTOK_USER_TEMPLATE,
  TIKTOK_USER_TEMPLATE_FROM_PACK,
  TIKTOK_PROMPT_TEMPLATE,
} from "./prompts/tiktok";
import {
  YOUTUBE_SYSTEM_PROMPT,
  YOUTUBE_USER_TEMPLATE,
  YOUTUBE_USER_TEMPLATE_FROM_PACK,
  YOUTUBE_PROMPT_TEMPLATE,
} from "./prompts/youtube";

/**
 * Replace placeholders in a prompt template
 */
export function formatPrompt(template: string, variables: Record<string, string>): string {
  let formattedPrompt = template;
  for (const [key, value] of Object.entries(variables)) {
    formattedPrompt = formattedPrompt.replace(new RegExp(`\\{${key}\\}`, "g"), value ?? "");
  }
  return formattedPrompt;
}

/**
 * Get short system prompt for a platform (rules only, no content)
 */
export function getPlatformSystemPrompt(platform: string): string {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return LINKEDIN_SYSTEM_PROMPT;
    case "twitter":
      return TWITTER_SYSTEM_PROMPT;
    case "email":
      return EMAIL_SYSTEM_PROMPT;
    case "instagram":
      return INSTAGRAM_SYSTEM_PROMPT;
    case "facebook":
      return FACEBOOK_SYSTEM_PROMPT;
    case "tiktok":
      return TIKTOK_SYSTEM_PROMPT;
    case "youtube":
      return YOUTUBE_SYSTEM_PROMPT;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get user message template for a platform (task + {sourceContent}, {brandVoice})
 */
export function getPlatformUserTemplate(platform: string): string {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return LINKEDIN_USER_TEMPLATE;
    case "twitter":
      return TWITTER_USER_TEMPLATE;
    case "email":
      return EMAIL_USER_TEMPLATE;
    case "instagram":
      return INSTAGRAM_USER_TEMPLATE;
    case "facebook":
      return FACEBOOK_USER_TEMPLATE;
    case "tiktok":
      return TIKTOK_USER_TEMPLATE;
    case "youtube":
      return YOUTUBE_USER_TEMPLATE;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get user message template when generating from Content Pack ({contentPack}, {brandVoice})
 */
export function getPlatformUserTemplateFromPack(platform: string): string {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return LINKEDIN_USER_TEMPLATE_FROM_PACK;
    case "twitter":
      return TWITTER_USER_TEMPLATE_FROM_PACK;
    case "email":
      return EMAIL_USER_TEMPLATE_FROM_PACK;
    case "instagram":
      return INSTAGRAM_USER_TEMPLATE_FROM_PACK;
    case "facebook":
      return FACEBOOK_USER_TEMPLATE_FROM_PACK;
    case "tiktok":
      return TIKTOK_USER_TEMPLATE_FROM_PACK;
    case "youtube":
      return YOUTUBE_USER_TEMPLATE_FROM_PACK;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get the appropriate prompt template for a platform (legacy: single combined template)
 */
export function getPlatformPromptTemplate(platform: string): string {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return LINKEDIN_PROMPT_TEMPLATE;
    case "twitter":
      return TWITTER_PROMPT_TEMPLATE;
    case "email":
      return EMAIL_PROMPT_TEMPLATE;
    case "instagram":
      return INSTAGRAM_PROMPT_TEMPLATE;
    case "facebook":
      return FACEBOOK_PROMPT_TEMPLATE;
    case "tiktok":
      return TIKTOK_PROMPT_TEMPLATE;
    case "youtube":
      return YOUTUBE_PROMPT_TEMPLATE;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}