/**
 * Unit tests for content validation and sanitization
 */
import { describe, it, expect } from "vitest";
import {
  validateContentLength,
  validateContentSafety,
  sanitizeContent,
  validatePlatformContent,
} from "@/lib/utils/content-validation";

describe("content-validation", () => {
  describe("validateContentLength", () => {
    it("returns valid for content within LinkedIn limits (1200-2500)", () => {
      const content = "a".repeat(1500);
      const result = validateContentLength(content, "linkedin");
      expect(result.isValid).toBe(true);
    });

    it("returns invalid when content too short for LinkedIn", () => {
      const content = "short";
      const result = validateContentLength(content, "linkedin");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("too short");
    });

    it("returns invalid when content too long for LinkedIn", () => {
      const content = "a".repeat(3000);
      const result = validateContentLength(content, "linkedin");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("too long");
    });

    it("returns invalid when content exceeds Twitter 280 chars", () => {
      const content = "a".repeat(300);
      const result = validateContentLength(content, "twitter");
      expect(result.isValid).toBe(false);
    });

    it("returns valid for content within Twitter limit", () => {
      const content = "a".repeat(280);
      const result = validateContentLength(content, "twitter");
      expect(result.isValid).toBe(true);
    });

    it("returns valid for unknown platform", () => {
      const result = validateContentLength("any", "unknown");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateContentSafety", () => {
    it("returns valid for plain text", () => {
      const result = validateContentSafety("Hello world");
      expect(result.isValid).toBe(true);
    });

    it("returns invalid for script tag", () => {
      const result = validateContentSafety("<script>alert(1)</script>");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("prohibited");
    });

    it("returns invalid for javascript: href", () => {
      const result = validateContentSafety('<a href="javascript:void(0)">x</a>');
      expect(result.isValid).toBe(false);
    });

    it("returns invalid for on-event handler", () => {
      const result = validateContentSafety('<div onclick="alert(1)">x</div>');
      expect(result.isValid).toBe(false);
    });
  });

  describe("sanitizeContent", () => {
    it("removes script tags", () => {
      const input = "Hello <script>evil()</script> world";
      const result = sanitizeContent(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("removes javascript: from href", () => {
      const input = 'Link <a href="javascript:alert(1)">x</a>';
      const result = sanitizeContent(input);
      expect(result).not.toMatch(/javascript:/i);
    });

    it("preserves safe content", () => {
      const input = "Plain text with **markdown** and line breaks.";
      const result = sanitizeContent(input);
      expect(result).toBe(input);
    });
  });

  describe("validatePlatformContent", () => {
    it("returns valid for safe content within length", () => {
      const content = "a".repeat(1500);
      const result = validatePlatformContent(content, "linkedin");
      expect(result.isValid).toBe(true);
      expect(result.messages).toHaveLength(0);
    });

    it("returns invalid and messages when length fails", () => {
      const result = validatePlatformContent("short", "linkedin");
      expect(result.isValid).toBe(false);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it("returns invalid when safety fails", () => {
      const result = validatePlatformContent("<script>x</script>", "linkedin");
      expect(result.isValid).toBe(false);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });
});
