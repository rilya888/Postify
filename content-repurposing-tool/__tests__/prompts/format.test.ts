/**
 * Prompt testing: formatPrompt, getPlatformPromptTemplate, no leftover placeholders
 */
import { describe, it, expect } from "vitest";
import { formatPrompt, getPlatformPromptTemplate } from "@/lib/ai/prompt-templates";

const TEST_SOURCE = "Sample source content for testing.";

describe("prompt-templates", () => {
  describe("formatPrompt", () => {
    it("replaces {sourceContent} placeholder with provided value", () => {
      const template = "Content: {sourceContent}";
      const result = formatPrompt(template, { sourceContent: TEST_SOURCE });
      expect(result).toContain(TEST_SOURCE);
      expect(result).not.toContain("{sourceContent}");
    });

    it("replaces multiple occurrences of same placeholder", () => {
      const template = "A: {sourceContent} B: {sourceContent}";
      const result = formatPrompt(template, { sourceContent: "x" });
      expect(result).toBe("A: x B: x");
    });
  });

  describe("getPlatformPromptTemplate", () => {
    const platforms = ["linkedin", "twitter", "email"] as const;

    platforms.forEach((platform) => {
      it(`returns non-empty template for ${platform}`, () => {
        const template = getPlatformPromptTemplate(platform);
        expect(template).toBeTypeOf("string");
        expect(template.length).toBeGreaterThan(0);
        expect(template).toContain("{sourceContent}");
      });
    });

    it("throws for unsupported platform", () => {
      expect(() => getPlatformPromptTemplate("unknown")).toThrow("Unsupported platform");
    });

    it("accepts platform in different case", () => {
      const t1 = getPlatformPromptTemplate("LINKEDIN");
      const t2 = getPlatformPromptTemplate("linkedin");
      expect(t1).toBe(t2);
    });
  });

  describe("formatted prompt has no leftover placeholders", () => {
    const platforms = ["linkedin", "twitter", "email"] as const;

    platforms.forEach((platform) => {
      it(`${platform}: after formatPrompt no {sourceContent} in result`, () => {
        const template = getPlatformPromptTemplate(platform);
        const result = formatPrompt(template, { sourceContent: TEST_SOURCE });
        expect(result).not.toContain("{sourceContent}");
        expect(result).toContain(TEST_SOURCE);
      });
    });
  });
});
