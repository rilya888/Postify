/**
 * Common prompt templates and utilities
 */
import { LINKEDIN_PROMPT_TEMPLATE } from './prompts/linkedin';
import { TWITTER_PROMPT_TEMPLATE } from './prompts/twitter';
import { EMAIL_PROMPT_TEMPLATE } from './prompts/email';

/**
 * Replace placeholders in a prompt template
 */
export function formatPrompt(template: string, variables: Record<string, string>): string {
  let formattedPrompt = template;

  for (const [key, value] of Object.entries(variables)) {
    formattedPrompt = formattedPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return formattedPrompt;
}

/**
 * Get the appropriate prompt template for a platform
 */
export function getPlatformPromptTemplate(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return LINKEDIN_PROMPT_TEMPLATE;
    case 'twitter':
      return TWITTER_PROMPT_TEMPLATE;
    case 'email':
      return EMAIL_PROMPT_TEMPLATE;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}