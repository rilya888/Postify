/**
 * Twitter/X-specific prompt templates.
 */

export const TWITTER_SYSTEM_PROMPT = `You are an expert content creator for Twitter/X. Requirements: Up to 280 characters. Clear, concise. Main thought at start. Informal, engaging. 1-3 hashtags. Output only the tweet, no explanations.`;

export const TWITTER_USER_TEMPLATE = `Task: Repurpose the following into a tweet.

Example: Source "New productivity course — 10 modules, practice." → Tweet "New course: how to follow through to the end 🚀 10 modules + practice. Link in profile. #productivity #courses"

{brandVoice}

Source content:
{sourceContent}`;

export const TWITTER_USER_TEMPLATE_FROM_PACK = `Task: Write a tweet using ONLY the following content pack.

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const TWITTER_PROMPT_TEMPLATE = `${TWITTER_SYSTEM_PROMPT}\n\n${TWITTER_USER_TEMPLATE}`;