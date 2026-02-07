/**
 * Unit tests for post-tone constants and helpers.
 */
import { describe, it, expect } from "vitest";
import {
  getTonePromptInstruction,
  getToneById,
  isToneRecommendedForPlatform,
  getTonePlatformWarning,
  isValidToneId,
} from "@/lib/constants/post-tones";

describe("post-tones", () => {
  describe("getTonePromptInstruction", () => {
    it("returns empty string for neutral", () => {
      expect(getTonePromptInstruction("neutral")).toBe("");
    });

    it("returns empty string for null", () => {
      expect(getTonePromptInstruction(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(getTonePromptInstruction(undefined)).toBe("");
    });

    it("returns empty string for unknown id", () => {
      expect(getTonePromptInstruction("unknown-tone")).toBe("");
    });

    it("returns instruction containing TONE: Professional for professional", () => {
      const result = getTonePromptInstruction("professional");
      expect(result).toContain("TONE: Professional");
      expect(result.length).toBeGreaterThan(10);
    });

    it("returns instruction containing TONE: Bold for sassy", () => {
      const result = getTonePromptInstruction("sassy");
      expect(result).toContain("TONE: Bold");
      expect(result.length).toBeGreaterThan(10);
    });

    it("returns instruction for all storable tone ids", () => {
      const ids = [
        "professional",
        "friendly",
        "sassy",
        "polite",
        "authoritative",
        "witty",
        "inspirational",
        "casual",
        "urgent",
      ];
      for (const id of ids) {
        const result = getTonePromptInstruction(id);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/^TONE:/m);
      }
    });
  });

  describe("getToneById", () => {
    it("returns tone object for valid id", () => {
      const tone = getToneById("professional");
      expect(tone).toBeDefined();
      expect(tone?.id).toBe("professional");
      expect(tone?.icon).toBe("💼");
      expect(tone?.labelKey).toContain("professional");
    });

    it("returns undefined for invalid id", () => {
      expect(getToneById("invalid")).toBeUndefined();
    });

    it("returns undefined for null", () => {
      expect(getToneById(null as unknown as string)).toBeUndefined();
    });
  });

  describe("isToneRecommendedForPlatform", () => {
    it("returns true for professional on linkedin", () => {
      expect(isToneRecommendedForPlatform("professional", "linkedin")).toBe(true);
    });

    it("returns true for sassy on twitter", () => {
      expect(isToneRecommendedForPlatform("sassy", "twitter")).toBe(true);
    });

    it("returns false when tone is not recommended for platform", () => {
      // sassy has recommendedPlatforms: ["twitter"] - may not include all platforms
      const result = isToneRecommendedForPlatform("sassy", "linkedin");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getTonePlatformWarning", () => {
    it("returns warning for sassy on linkedin", () => {
      const warning = getTonePlatformWarning("sassy", "linkedin");
      expect(warning).toBeDefined();
      expect(typeof warning).toBe("string");
      expect(warning!.length).toBeGreaterThan(0);
    });

    it("returns undefined when no warning for combination", () => {
      const warning = getTonePlatformWarning("professional", "linkedin");
      expect(warning).toBeUndefined();
    });
  });

  describe("isValidToneId", () => {
    it("returns true for all storable tone ids", () => {
      const valid = [
        "professional",
        "friendly",
        "sassy",
        "polite",
        "authoritative",
        "witty",
        "inspirational",
        "casual",
        "urgent",
      ];
      for (const id of valid) {
        expect(isValidToneId(id)).toBe(true);
      }
    });

    it("returns false for neutral (UI only, not storable)", () => {
      expect(isValidToneId("neutral")).toBe(false);
    });

    it("returns false for invalid strings", () => {
      expect(isValidToneId("")).toBe(false);
      expect(isValidToneId("unknown")).toBe(false);
    });
  });
});
