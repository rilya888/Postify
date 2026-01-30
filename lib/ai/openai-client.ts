import OpenAI from "openai";

/**
 * OpenAI client configuration
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Type for generation options
 */
export type GenerationOptions = {
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

/**
 * Generate content using OpenAI API
 */
export async function generateContent(
  prompt: string,
  systemPrompt: string,
  options?: GenerationOptions
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

/**
 * Generate content with retry logic
 */
export async function generateContentWithRetry(
  prompt: string,
  systemPrompt: string,
  options?: GenerationOptions,
  maxRetries: number = 3
): Promise<string> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateContent(prompt, systemPrompt, options);
    } catch (error) {
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}