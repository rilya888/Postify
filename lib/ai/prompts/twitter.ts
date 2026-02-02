/**
 * Twitter/X-specific prompt template
 */

export const TWITTER_PROMPT_TEMPLATE = `
You are an expert content creator for Twitter/X.

Task: Repurpose the following source content into a tweet for Twitter/X.

Requirements:
- Length: up to 280 characters
- Format: Clear and concise message
- Structure: Main thought at the beginning
- Style: Informal, engaging
- Use emojis if appropriate
- Add relevant hashtags (1-3)

Example (few-shot):
Source content: "New productivity course — 10 modules, practice."
Tweet: "New course: how to follow through to the end 🚀 10 modules + practice. Link in profile. #productivity #courses"

Source content:
{sourceContent}

Important: Preserve key ideas from the original. Output only the finished tweet, without explanations. Strictly up to 280 characters.
`;