/**
 * Unit tests for OpenAI client (with mocks)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        get create() {
          return mockCreate;
        },
      },
    };
  },
}));

// Import after mock so module uses mocked OpenAI
import { getOpenAIClient, generateContent, generateContentWithRetry } from "@/lib/ai/openai-client";

describe("openai-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test-key";
  });

  describe("getOpenAIClient", () => {
    it("returns client when OPENAI_API_KEY is set", () => {
      const client = getOpenAIClient();
      expect(client).toBeDefined();
      expect(client.chat).toBeDefined();
      expect(client.chat.completions.create).toBeDefined();
    });
  });

  describe("generateContent", () => {
    it("calls chat.completions.create with correct params", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Generated text" } }],
      });

      const result = await generateContent("user prompt", "system prompt", {
        temperature: 0.5,
        maxTokens: 1000,
        model: "gpt-4",
      });

      expect(result).toBe("Generated text");
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      expect(call.model).toBe("gpt-4");
      expect(call.temperature).toBe(0.5);
      expect(call.max_tokens).toBe(1000);
      expect(call.messages).toEqual([
        { role: "system", content: "system prompt" },
        { role: "user", content: "user prompt" },
      ]);
    });

    it("returns empty string when content is null", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await generateContent("p", "s");
      expect(result).toBe("");
    });

    it("throws when API throws", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API error"));

      await expect(generateContent("p", "s")).rejects.toThrow("API error");
    });
  });

  describe("generateContentWithRetry", () => {
    it("returns result on first success", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Ok" } }],
      });

      const result = await generateContentWithRetry("p", "s");
      expect(result).toBe("Ok");
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("retries on failure then succeeds", async () => {
      mockCreate
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce({ choices: [{ message: { content: "Ok" } }] });

      const result = await generateContentWithRetry("p", "s", undefined, 3);
      expect(result).toBe("Ok");
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("throws last error after max retries", async () => {
      mockCreate.mockRejectedValue(new Error("Always fail"));

      await expect(
        generateContentWithRetry("p", "s", undefined, 2)
      ).rejects.toThrow("Always fail");
      // 2 retries with primary model + 2 with fallback (gpt-3.5-turbo) = 4
      expect(mockCreate).toHaveBeenCalledTimes(4);
    });
  });
});
