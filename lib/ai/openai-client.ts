import OpenAI from "openai";
import { generateCacheKey, getCachedValue, setCachedValue } from "@/lib/services/cache";

/**
 * OpenAI client configuration
 */
let openai: OpenAI;

/**
 * Get or create OpenAI client instance
 * Initializes the client lazily to avoid build-time errors
 */
export function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key. Please set the OPENAI_API_KEY environment variable.");
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

/**
 * Type for generation options
 */
export type GenerationOptions = {
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

/**
 * Generate content using OpenAI API with fallback
 */
export async function generateContent(
  prompt: string,
  systemPrompt: string,
  options?: GenerationOptions
): Promise<string> {
  try {
    const client = getOpenAIClient();
    const model = options?.model || "gpt-4-turbo";

    const response = await client.chat.completions.create({
      model: model,
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
    console.error("Error generating content with primary model:", error);

    // If the primary model failed and it was gpt-4-turbo, try gpt-3.5-turbo as fallback
    if ((options?.model || "gpt-4-turbo") === "gpt-4-turbo") {
      console.log("Falling back to gpt-3.5-turbo...");
      try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: "gpt-3.5-turbo",
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
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError);
        throw error; // Re-throw the original error
      }
    } else {
      throw error;
    }
  }
}

/**
 * Generate content with retry logic and fallback
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

/**
 * Generate content with graceful degradation to cached responses.
 * Uses deterministic cacheKey when provided; ttlSeconds for outputs (default 7 days per plan).
 */
export async function generateContentWithGracefulDegradation(
  userMessage: string,
  systemPrompt: string,
  options?: GenerationOptions,
  maxRetries: number = 3,
  cacheKey?: string,
  ttlSeconds: number = 7 * 24 * 3600
): Promise<{ content: string; source: "api" | "cache" | "template" }> {
  const effectiveCacheKey =
    cacheKey || generateCacheKey(JSON.stringify({ userMessage, systemPrompt, options }));

  try {
    const cachedResponse = await getCachedValue(effectiveCacheKey);
    if (cachedResponse) {
      return { content: cachedResponse, source: "cache" };
    }
  } catch (cacheError) {
    console.warn("Cache retrieval failed:", cacheError);
  }

  try {
    const content = await generateContentWithRetry(userMessage, systemPrompt, options, maxRetries);

    try {
      await setCachedValue(effectiveCacheKey, content, ttlSeconds);
    } catch (cacheError) {
      console.warn("Cache storage failed:", cacheError);
    }

    return { content, source: "api" };
  } catch (error) {
    console.error("API generation failed, attempting fallback methods:", error);

    try {
      const templateContent = generateBasicTemplate(userMessage);
      return { content: templateContent, source: "template" };
    } catch (templateError) {
      console.error("All fallback methods failed:", templateError);
      throw error;
    }
  }
}

/**
 * Generate a basic template as a fallback when API is unavailable
 */
function generateBasicTemplate(prompt: string): string {
  // Extract the main topic from the prompt
  const lines = prompt.split('\n');
  const sourceContentLine = lines.find(line => line.includes('{sourceContent}') || line.includes('Source content'));

  if (sourceContentLine) {
    // Extract the actual source content from the prompt
    const sourceMatch = prompt.match(/\{sourceContent\}\s*\n([\s\S]*)/i);
    if (sourceMatch && sourceMatch[1]) {
      const sourceContent = sourceMatch[1].substring(0, 200) + '...'; // Truncate to prevent overly long content

      return `**AI SERVICE TEMPORARILY UNAVAILABLE**\n\nBased on your source content:\n\n${sourceContent}\n\n[Content generation service is currently experiencing issues. Please try again later.]`;
    }
  }

  return `**AI SERVICE TEMPORARILY UNAVAILABLE**\n\n[Content generation service is currently experiencing issues. Please try again later.]`;
}