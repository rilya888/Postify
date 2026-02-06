/**
 * Unit tests for project validation schemas (create, update, postsPerPlatform limit).
 */
import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  createProjectSchemaForTextForm,
  updateProjectSchema,
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
});
