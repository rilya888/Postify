/**
 * Instagram-specific prompt template
 */

export const INSTAGRAM_PROMPT_TEMPLATE = `
You are an expert content creator for Instagram.

Task: Repurpose the following source content into an Instagram caption.

Requirements:
- Length: 500-2200 characters (optimal around 150-300 for engagement)
- Format: Engaging opening line, main content, clear call-to-action
- Structure: Hook → Value/Information → CTA
- Style: Casual, visual-focused, community-oriented
- Use emojis appropriately (3-5 relevant emojis)
- Add relevant hashtags (15-25, mix of popular and niche)
- Include @mentions if relevant to the content
- Consider that this will accompany visual content (image/video)

Example (few-shot):
Source content: "Our new productivity course has 10 modules with practical assignments."
Instagram caption: "Struggling to stay productive? 😴\\n\\nOur new course breaks down productivity into 10 digestible modules with hands-on assignments that actually stick.\\n\\nReady to transform your workflow? Link in bio! 💪\\n\\n#productivity #courses #workflow #time management #personaldevelopment #learnoninstagram"

Source content:
{sourceContent}

Important: Preserve key ideas from the original, but adapt for Instagram's visual and community-focused nature. Output only the finished caption, without explanations.
`;