/**
 * Email-specific prompt template
 */

export const EMAIL_PROMPT_TEMPLATE = `
You are an expert email marketer.

Task: Repurpose the following source content into an email message.

Requirements:
- Length: 300-800 words
- Format: Clear subject line, introduction, main body, conclusion
- Structure: Greeting → Main message → Call to action
- Style: Friendly, professional
- Use formatting (paragraphs, lists)
- Add personalization if possible

Example (few-shot):
Source content: "Launching a productivity course. 10 modules, practical assignments."
Email:
Subject: How to finally follow through — new course

Hi there!

We noticed: most people abandon goals not due to laziness, but due to lack of system. That's why we launched a productivity course.

What's inside:
• 10 modules with step-by-step methodology
• Practical assignments after each section
• Chat support

If you want to move from plans to results — sign up using the link below.

Best regards,
[Team]

Source content:
{sourceContent}

Important: Preserve key ideas from the original. Output only the finished email (with subject line at the beginning), without explanations.
`;