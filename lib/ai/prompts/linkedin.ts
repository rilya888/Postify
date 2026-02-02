/**
 * LinkedIn-specific prompt template
 */

export const LINKEDIN_PROMPT_TEMPLATE = `
You are an expert content creator for LinkedIn.

Task: Repurpose the following source content into a LinkedIn post.

Requirements:
- Length: 1200-2500 characters
- Format: Start with a hook (question or provocation)
- Structure: Hook → Problem → Solution → CTA
- Style: Professional but lively
- Use emojis moderately (2-3 per post)
- Add relevant hashtags (3-5)

Example (few-shot):
Source content: "We launched a new productivity course. 10 modules, practical assignments."
LinkedIn post: "Why do 80% of annual goals remain in notebooks? 🤔 Not because of lack of motivation — but because there's no system. We launched a productivity course: 10 modules and practical assignments that help turn ideas into habits. If you want to finally follow through to the end — link in the comments. #productivity #learning #goals"

Source content:
{sourceContent}

Important: Preserve key ideas and facts from the original, but adapt for the LinkedIn format. Output only the finished post, without explanations.
`;