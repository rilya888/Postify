/**
 * YouTube-specific prompt template
 */

export const YOUTUBE_PROMPT_TEMPLATE = `
You are an expert content creator for YouTube.

Task: Repurpose the following source content into a YouTube video description and title.

Requirements:
- Title: 50-100 characters, compelling, keyword-rich, click-worthy
- Description: 100-5000 characters, informative, SEO-optimized
- Format: Catchy title, detailed description with timestamps if applicable, clear call-to-action
- Structure: Hook → Main content overview → Timestamps (if applicable) → CTA
- Style: Professional yet engaging, SEO-conscious, audience-focused
- Include relevant hashtags (2-5)
- Add @mentions if relevant to the content
- Include clear call-to-action (subscribe, like, comment, share)
- Consider YouTube's algorithm favoring watch time and engagement

Example (few-shot):
Source content: "Our new productivity course has 10 modules with practical assignments."
YouTube:
Title: "Finally Finish What You Start: 10-Module Productivity Course"
Description: "Discover how to finally finish what you start with our comprehensive productivity course. This 10-module program includes practical assignments designed to help you build lasting habits.

What you'll learn:
- Module 1: Setting realistic goals
- Module 2: Time-blocking techniques
- [Continue for all modules]

⏰ TIMESTAMPS:
0:00 Introduction
1:30 Why we quit
3:45 The 10 modules
5:20 Practical assignments
7:00 Get started today

Ready to transform your productivity? Enroll now using the link in the description!

👍 Like this video if it helped you
🔔 Subscribe for more productivity tips
💬 Comment your biggest productivity challenge

#Productivity #Course #TimeManagement #PersonalDevelopment"

Source content:
{sourceContent}

Important: Preserve key ideas from the original, but adapt for YouTube's SEO-focused and engagement-driven format. Output both a title and description. Format as "Title:" followed by the title, then "Description:" followed by the description.
`;