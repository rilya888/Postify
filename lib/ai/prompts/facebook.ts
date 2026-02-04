/**
 * Facebook-specific prompt templates.
 */

export const FACEBOOK_SYSTEM_PROMPT = `You are an expert content creator for Facebook. Requirements: 50-5000 characters (100-250 optimal). Opener → content → engagement prompt. Conversational, community-focused. 1-3 emojis, 1-5 hashtags. Output only the post, no explanations.`;

export const FACEBOOK_USER_TEMPLATE = `Task: Repurpose the following into a Facebook post.

{brandVoice}

Source content:
{sourceContent}`;

export const FACEBOOK_USER_TEMPLATE_FROM_PACK = `Task: Write a Facebook post using ONLY the following content pack.

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const FACEBOOK_PROMPT_TEMPLATE = `${FACEBOOK_SYSTEM_PROMPT}\n\n${FACEBOOK_USER_TEMPLATE}`;