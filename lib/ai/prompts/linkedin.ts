/**
 * LinkedIn-specific prompt templates.
 * System = short rules only. User = task + data (sourceContent, brandVoice).
 */

export const LINKEDIN_SYSTEM_PROMPT = `You are an expert content creator for LinkedIn.
Requirements: Length 1200-2500 characters. Format: start with a hook (question or provocation). Structure: Hook → Problem → Solution → CTA. Style: professional but lively. Use 2-3 emojis. Add 3-5 relevant hashtags. Output only the finished post, no explanations.`;

export const LINKEDIN_USER_TEMPLATE = `Task: Repurpose the following source content into a LinkedIn post.

Example: Source "We launched a new productivity course. 10 modules, practical assignments." → Post "Why do 80% of annual goals remain in notebooks? 🤔 Not because of lack of motivation — but because there's no system. We launched a productivity course: 10 modules and practical assignments that help turn ideas into habits. If you want to finally follow through to the end — link in the comments. #productivity #learning #goals"

{brandVoice}

Source content:
{sourceContent}`;

/** User template when generating from Content Pack (input = contentPack, not full text) */
export const LINKEDIN_USER_TEMPLATE_FROM_PACK = `Task: Write a LinkedIn post using ONLY the following content pack (no other source).

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use LINKEDIN_SYSTEM_PROMPT + LINKEDIN_USER_TEMPLATE */
export const LINKEDIN_PROMPT_TEMPLATE = `${LINKEDIN_SYSTEM_PROMPT}\n\n${LINKEDIN_USER_TEMPLATE}`;