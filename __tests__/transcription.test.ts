/**
 * Unit tests for transcription service (mock Whisper API).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTranscriptionsCreate = vi.fn();

vi.mock("@/lib/ai/openai-client", () => ({
  getOpenAIClient: () => ({
    audio: {
      transcriptions: {
        create: (...args: unknown[]) => mockTranscriptionsCreate(...args),
      },
    },
  }),
}));

vi.mock("fs", () => ({
  default: {
    createReadStream: () => ({ pipe: () => {} }),
  },
}));

import {
  transcribeAudioFile,
  normalizeTranscript,
} from "@/lib/services/transcription";

describe("transcription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranscriptionsCreate.mockResolvedValue({
      text: "Hello world transcript",
      language: "en",
      duration: 10.5,
    });
  });

  it("normalizeTranscript trims and collapses whitespace", () => {
    expect(normalizeTranscript("  a  b  \n\n  c  ")).toBe("a b c");
  });

  it("transcribeAudioFile returns text and duration", async () => {
    const result = await transcribeAudioFile("/tmp/test.mp3");
    expect(result).toHaveProperty("text", "Hello world transcript");
    expect(result).toHaveProperty("language", "en");
    expect(result).toHaveProperty("durationSeconds", 10.5);
  });

  it("transcribeAudioFile is called with file path and verbose_json", async () => {
    await transcribeAudioFile("/tmp/audio.m4a");
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        response_format: "verbose_json",
      })
    );
  });
});
