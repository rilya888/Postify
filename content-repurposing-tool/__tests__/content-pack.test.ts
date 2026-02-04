/**
 * Unit tests for Content Pack service (mock OpenAI).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChatCreate = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/ai/openai-client", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockChatCreate(...args),
      },
    },
  }),
}));

import { buildContentPackFromText } from "@/lib/services/content-pack";

const validPackJson = {
  summary_short: "Short summary in 5-7 lines.",
  summary_long: "Longer summary in 12-20 lines for context.",
  key_points: ["Point 1", "Point 2", "Point 3"],
  audience: "Target audience",
  tone_suggestions: "Professional, friendly",
  quotes: ["Quote one", "Quote two"],
  cta_options: ["CTA 1", "CTA 2"],
};

describe("content-pack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(validPackJson),
          },
        },
      ],
    });
  });

  it("buildContentPackFromText is a function", () => {
    expect(typeof buildContentPackFromText).toBe("function");
  });

  it("returns valid Content Pack with required fields", async () => {
    const result = await buildContentPackFromText("Some source text here.");
    expect(result).toHaveProperty("summary_short", validPackJson.summary_short);
    expect(result).toHaveProperty("summary_long", validPackJson.summary_long);
    expect(result).toHaveProperty("key_points");
    expect(Array.isArray(result.key_points)).toBe(true);
    expect(result.key_points).toHaveLength(3);
    expect(result).toHaveProperty("audience");
    expect(result).toHaveProperty("quotes");
    expect(Array.isArray(result.quotes)).toBe(true);
    expect(result).toHaveProperty("cta_options");
    expect(Array.isArray(result.cta_options)).toBe(true);
  });

  it("strips markdown code fence from response", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify(validPackJson) + "\n```",
          },
        },
      ],
    });
    const result = await buildContentPackFromText("Text");
    expect(result.summary_short).toBe(validPackJson.summary_short);
  });

  it("throws when required fields missing", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ summary_long: "Only long" }),
          },
        },
      ],
    });
    await expect(buildContentPackFromText("Text")).rejects.toThrow(
      "Invalid Content Pack: missing required fields"
    );
  });
});
