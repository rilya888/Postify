/**
 * TikTok-specific prompt templates.
 */

export const TIKTOK_SYSTEM_PROMPT = `You are an expert content creator for TikTok. Requirements: 1-150 characters. Hook → brief context → engagement. Trendy, viral potential. 1-3 emojis, 3-5 hashtags. Output only the caption, no explanations.`;

export const TIKTOK_USER_TEMPLATE = `Task: Repurpose the following into a TikTok caption.

{brandVoice}

Source content:
{sourceContent}`;

export const TIKTOK_USER_TEMPLATE_FROM_PACK = `Task: Write a TikTok caption using ONLY the following content pack (1-150 chars).

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const TIKTOK_PROMPT_TEMPLATE = `${TIKTOK_SYSTEM_PROMPT}\n\n${TIKTOK_USER_TEMPLATE}`;