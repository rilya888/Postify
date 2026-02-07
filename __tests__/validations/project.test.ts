/**
 * Unit tests for project validation schemas (create, update, postsPerPlatform limit).
 */
import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  createProjectSchemaForTextForm,
  updateProjectSchema,
  validatePostToneForPlan,
} from "@/lib/validations/project";

describe("project validation", () => {
  describe("createProjectSchema", () => {
    const validBase = {
      title: "My Project",
      sourceContent: "At least ten chars here",
      platforms: ["linkedin"] as const,
    };

    it("accepts valid data without postsPerPlatform (defaults to 1 for limit)", () => {
      const result = createProjectSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it("accepts postsPerPlatform 1, 2, 3", () => {
      expect(createProjectSchema.safeParse({ ...validBase, postsPerPlatform: 1 }).success).toBe(true);
      expect(createProjectSchema.safeParse({ ...validBase, postsPerPlatform: 2 }).success).toBe(true);
      expect(createProjectSchema.safeParse({ ...validBase, postsPerPlatform: 3 }).success).toBe(true);
    });

    it("rejects when platforms.length * postsPerPlatform > 10", () => {
      // 4 platforms * 3 posts = 12 > 10
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin", "twitter", "email", "instagram"],
        postsPerPlatform: 3,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatform"))).toBe(true);
      }
    });

    it("accepts when platforms.length * postsPerPlatform <= 10", () => {
      // 3 platforms * 3 posts = 9
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin", "twitter", "email"],
        postsPerPlatform: 3,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid postsPerPlatform value", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        postsPerPlatform: 4,
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid postsPerPlatformByPlatform (sum <= 10)", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin", "tiktok"],
        postsPerPlatformByPlatform: { linkedin: 2, tiktok: 3 },
      });
      expect(result.success).toBe(true);
    });

    it("rejects when sum of postsPerPlatformByPlatform > 10", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin", "twitter", "email", "instagram"],
        postsPerPlatformByPlatform: { linkedin: 3, twitter: 3, email: 3, instagram: 3 },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatform") || i.path.includes("postsPerPlatformByPlatform"))).toBe(true);
      }
    });

    it("rejects when postsPerPlatformByPlatform has key not in platforms", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin"],
        postsPerPlatformByPlatform: { linkedin: 2, twitter: 3 },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatformByPlatform"))).toBe(true);
      }
    });

    it("rejects when postsPerPlatformByPlatform has invalid value (e.g. 4)", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin"],
        postsPerPlatformByPlatform: { linkedin: 4 },
      });
      expect(result.success).toBe(false);
    });

    it("accepts map without postsPerPlatform (backward compatibility)", () => {
      const result = createProjectSchema.safeParse({
        ...validBase,
        platforms: ["linkedin", "twitter"],
        postsPerPlatformByPlatform: { linkedin: 1, twitter: 2 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createProjectSchemaForTextForm", () => {
    const validBase = {
      title: "My Project",
      sourceContent: "At least ten characters for the form",
      platforms: ["linkedin", "twitter"] as const,
    };

    it("accepts valid data with postsPerPlatform 2", () => {
      const result = createProjectSchemaForTextForm.safeParse({
        ...validBase,
        postsPerPlatform: 2,
      });
      expect(result.success).toBe(true);
    });

    it("rejects when platforms * postsPerPlatform exceeds 10", () => {
      const result = createProjectSchemaForTextForm.safeParse({
        ...validBase,
        platforms: ["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"],
        postsPerPlatform: 2,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatform"))).toBe(true);
      }
    });
  });

  describe("updateProjectSchema", () => {
    it("accepts partial update with postsPerPlatform only", () => {
      const result = updateProjectSchema.safeParse({ postsPerPlatform: 2 });
      expect(result.success).toBe(true);
    });

    it("accepts confirmDeleteExtraPosts flag", () => {
      const result = updateProjectSchema.safeParse({
        postsPerPlatform: 2,
        confirmDeleteExtraPosts: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects when platforms.length * postsPerPlatform > 10", () => {
      const result = updateProjectSchema.safeParse({
        platforms: ["linkedin", "twitter", "email", "instagram", "facebook"],
        postsPerPlatform: 3,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatform"))).toBe(true);
      }
    });

    it("accepts when platforms and postsPerPlatform within limit", () => {
      const result = updateProjectSchema.safeParse({
        platforms: ["linkedin", "twitter"],
        postsPerPlatform: 3,
      });
      expect(result.success).toBe(true);
    });

    it("accepts postsPerPlatformByPlatform within limit", () => {
      const result = updateProjectSchema.safeParse({
        platforms: ["linkedin", "tiktok"],
        postsPerPlatformByPlatform: { linkedin: 2, tiktok: 2 },
      });
      expect(result.success).toBe(true);
    });

    it("rejects update when postsPerPlatformByPlatform keys not in platforms", () => {
      const result = updateProjectSchema.safeParse({
        platforms: ["linkedin"],
        postsPerPlatformByPlatform: { linkedin: 2, twitter: 3 },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("postsPerPlatformByPlatform"))).toBe(true);
      }
    });
  });

  describe("postTone validation", () => {
    it("createProjectSchema accepts valid postTone", () => {
      const result = createProjectSchema.safeParse({
        title: "My Project",
        sourceContent: "At least ten chars here",
        platforms: ["linkedin"],
        postTone: "professional",
      });
      expect(result.success).toBe(true);
    });

    it("createProjectSchema accepts null postTone", () => {
      const result = createProjectSchema.safeParse({
        title: "My Project",
        sourceContent: "At least ten chars here",
        platforms: ["linkedin"],
        postTone: null,
      });
      expect(result.success).toBe(true);
    });

    it("createProjectSchema rejects invalid postTone", () => {
      const result = createProjectSchema.safeParse({
        title: "My Project",
        sourceContent: "At least ten chars here",
        platforms: ["linkedin"],
        postTone: "invalid-tone",
      });
      expect(result.success).toBe(false);
    });

    it("updateProjectSchema accepts postTone", () => {
      const result = updateProjectSchema.safeParse({ postTone: "sassy" });
      expect(result.success).toBe(true);
    });
  });

  describe("validatePostToneForPlan", () => {
    it("returns postTone for enterprise with valid tone", () => {
      expect(validatePostToneForPlan("professional", "enterprise")).toBe("professional");
      expect(validatePostToneForPlan("sassy", "enterprise")).toBe("sassy");
    });

    it("returns null for non-enterprise plans (silent ignore)", () => {
      expect(validatePostToneForPlan("professional", "free")).toBe(null);
      expect(validatePostToneForPlan("professional", "pro")).toBe(null);
      expect(validatePostToneForPlan("professional", "trial")).toBe(null);
    });

    it("returns null for null or empty postTone", () => {
      expect(validatePostToneForPlan(null, "enterprise")).toBe(null);
      expect(validatePostToneForPlan(undefined, "enterprise")).toBe(null);
      expect(validatePostToneForPlan("", "enterprise")).toBe(null);
    });

    it("returns null for invalid tone id even on enterprise", () => {
      expect(validatePostToneForPlan("invalid-tone", "enterprise")).toBe(null);
      expect(validatePostToneForPlan("neutral", "enterprise")).toBe(null);
    });
  });
});
