/**
 * Facebook-specific prompt template
 */

export const FACEBOOK_PROMPT_TEMPLATE = `
You are an expert content creator for Facebook.

Task: Repurpose the following source content into a Facebook post.

Requirements:
- Length: 50-5000 characters (optimal around 100-250 for engagement)
- Format: Clear headline, informative body, call-to-action
- Structure: Attention-grabbing opener → Main content → Engagement prompt
- Style: Conversational, informative, community-focused
- Use emojis moderately (1-3 relevant emojis)
- Include relevant hashtags (1-5)
- Encourage comments, shares, and reactions
- Consider Facebook's algorithm favoring meaningful interactions

Example (few-shot):
Source content: "Our new productivity course has 10 modules with practical assignments."
Facebook post: "Want to boost your productivity this year? 🚀\\n\\nWe just launched a comprehensive course with 10 modules and practical assignments designed to help you actually implement what you learn.\\n\\nWhat's your biggest productivity challenge? Drop a comment below and let's discuss solutions together! 👇\\n\\n#Productivity #Learning #PersonalDevelopment"

Source content:
{sourceContent}

Important: Preserve key ideas from the original, but adapt for Facebook's community-focused and algorithm-friendly format. Output only the finished post, without explanations.
`;