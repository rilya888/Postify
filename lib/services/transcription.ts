/**
 * Audio transcription service (Stage 4: text_audio plan).
 * Whisper API with retry; normalize transcript; no storage of raw audio after transcription.
 */

import fs from "fs";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { TRANSCRIPTION_MODEL } from "@/lib/constants/ai-models";
import { Logger } from "@/lib/utils/logger";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export type TranscriptionResult = {
  text: string;
  language?: string;
  durationSeconds?: number;
};

/**
 * Normalize transcript: trim, collapse multiple spaces/newlines.
 */
export function normalizeTranscript(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n");
}

/**
 * Transcribe audio file via OpenAI Whisper with retry and backoff.
 * Uses verbose_json to get language and duration when available.
 */
export async function transcribeAudioFile(
  filePath: string,
  options?: { language?: string }
): Promise<TranscriptionResult> {
  const client = getOpenAIClient();
  const model = TRANSCRIPTION_MODEL;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = fs.createReadStream(filePath);
      const response = await client.audio.transcriptions.create({
        file: stream,
        model,
        response_format: "verbose_json",
        language: options?.language,
      });

      const text = response.text ?? "";
      const language = response.language ?? undefined;
      const durationSeconds = response.duration ?? undefined;

      Logger.info("Transcription completed", {
        model,
        textLength: text.length,
        language,
        durationSeconds,
      });

      return { text, language, durationSeconds };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      Logger.info("Transcription attempt failed", {
        attempt: attempt + 1,
        error: lastError.message,
      });
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError ?? new Error("Transcription failed");
}

/**
 * Get audio duration in seconds from file (for pre-check before Whisper).
 * Optional: install "music-metadata" and uncomment to enable; otherwise duration is taken from Whisper response.
 */
export async function getAudioDurationSeconds(_filePath: string): Promise<number | undefined> {
  return undefined;
}
