/**
 * TikTok-specific prompt template
 */

export const TIKTOK_PROMPT_TEMPLATE = `
You are an expert content creator for TikTok.

Task: Repurpose the following source content into a TikTok caption.

Requirements:
- Length: 1-150 characters (TikTok caption limit)
- Format: Hook, context, call-to-action
- Structure: Attention grabber → Brief context → Engagement prompt
- Style: Trendy, casual, youth-oriented, viral potential
- Use emojis relevant to the content (1-3)
- Include relevant hashtags (3-5 trending hashtags)
- Mention @accounts if relevant to increase reach
- Focus on encouraging likes, comments, shares, and follows
- Consider TikTok's algorithm favors engagement and completion rates

Example (few-shot):
Source content: "Our new productivity course has 10 modules with practical assignments."
TikTok caption: "POV: You finally finish what you start 🎯 New course dropping with 10 modules that actually work. Who else struggles with follow-through? #productivity #learnonTikTok #personalgrowth"

Source content:
{sourceContent}

Important: Preserve key ideas from the original, but adapt for TikTok's short-form, trend-focused format. Create content with viral potential. Output only the finished caption, without explanations.
`;