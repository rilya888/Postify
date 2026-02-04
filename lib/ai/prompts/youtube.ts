/**
 * YouTube-specific prompt templates.
 */

export const YOUTUBE_SYSTEM_PROMPT = `You are an expert content creator for YouTube. Requirements: Title 50-100 chars, description 100-5000 chars. SEO-optimized. Title first, then description. 2-5 hashtags, CTA. Output "Title:" then title, "Description:" then description. No other explanations.`;

export const YOUTUBE_USER_TEMPLATE = `Task: Repurpose the following into a YouTube title and description.

{brandVoice}

Source content:
{sourceContent}`;

export const YOUTUBE_USER_TEMPLATE_FROM_PACK = `Task: Write a YouTube title and description using ONLY the following content pack. Output "Title:" then title, "Description:" then description.

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const YOUTUBE_PROMPT_TEMPLATE = `${YOUTUBE_SYSTEM_PROMPT}\n\n${YOUTUBE_USER_TEMPLATE}`;