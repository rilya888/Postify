/**
 * AI-related types for the content repurposing tool
 */

import { Platform } from "@/lib/constants/platforms";

/**
 * Options for AI content generation
 */
export type GenerationOptions = {
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

/**
 * Metadata for AI generation
 */
export type GenerationMetadata = {
  model: string;
  temperature: number;
  maxTokens: number;
  timestamp: Date | string;
  success: boolean;
  errorMessage?: string;
  validationMessages?: string[];
};

/**
 * Result of content generation for a single platform
 */
export type GenerationResult = {
  platform: Platform;
  content: string;
  success: boolean;
  metadata: GenerationMetadata;
  error?: string;
};

/**
 * Result of content generation for multiple platforms
 */
export type BulkGenerationResult = {
  successful: GenerationResult[];
  failed: GenerationResult[];
  totalRequested: number;
};