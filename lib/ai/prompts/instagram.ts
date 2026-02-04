/**
 * Instagram-specific prompt templates.
 */

export const INSTAGRAM_SYSTEM_PROMPT = `You are an expert content creator for Instagram. Requirements: 500-2200 characters (150-300 optimal). Hook → value → CTA. Casual, visual-focused. 3-5 emojis, 15-25 hashtags. Output only the caption, no explanations.`;

export const INSTAGRAM_USER_TEMPLATE = `Task: Repurpose the following into an Instagram caption.

{brandVoice}

Source content:
{sourceContent}`;

export const INSTAGRAM_USER_TEMPLATE_FROM_PACK = `Task: Write an Instagram caption using ONLY the following content pack.

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const INSTAGRAM_PROMPT_TEMPLATE = `${INSTAGRAM_SYSTEM_PROMPT}\n\n${INSTAGRAM_USER_TEMPLATE}`;