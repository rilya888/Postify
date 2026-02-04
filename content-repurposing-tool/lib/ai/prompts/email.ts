/**
 * Email-specific prompt templates.
 */

export const EMAIL_SYSTEM_PROMPT = `You are an expert email marketer. Requirements: 300-800 words. Clear subject line, intro, body, conclusion. Greeting → message → CTA. Friendly, professional. Paragraphs and lists. Output only the email (subject first), no explanations.`;

export const EMAIL_USER_TEMPLATE = `Task: Repurpose the following into an email.

Example: Source "Launching a productivity course. 10 modules, practical assignments." → Email with subject "How to finally follow through — new course", greeting, main message, CTA.

{brandVoice}

Source content:
{sourceContent}`;

export const EMAIL_USER_TEMPLATE_FROM_PACK = `Task: Write an email using ONLY the following content pack. Include subject line first.

{brandVoice}

Content pack:
{contentPack}`;

/** @deprecated Use SYSTEM + USER_TEMPLATE */
export const EMAIL_PROMPT_TEMPLATE = `${EMAIL_SYSTEM_PROMPT}\n\n${EMAIL_USER_TEMPLATE}`;