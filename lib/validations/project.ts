import { z } from "zod";

const platformEnum = z.enum(["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"]);
const postCountSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

/**
 * Validation schema for project creation (API).
 * sourceContent is optional: empty/missing allowed for "audio-first" flow; when provided, min 10 chars.
 */
const postsPerPlatformSchema = postCountSchema.optional();

/** Per-platform post count: keys = platform ids, values 1..3. Optional. */
const postsPerPlatformByPlatformSchema = z
  .record(platformEnum, postCountSchema)
  .optional()
  .refine(
    (val) => val === undefined || (typeof val === "object" && val !== null && !Array.isArray(val)),
    { message: "postsPerPlatformByPlatform must be an object" }
  );

function totalOutputsFromData(data: {
  platforms?: string[];
  postsPerPlatform?: number | null;
  postsPerPlatformByPlatform?: Record<string, number> | null;
}): number {
  const platforms = data.platforms ?? [];
  if (!platforms.length) return 0;
  const byPlatform = data.postsPerPlatformByPlatform;
  if (byPlatform && typeof byPlatform === "object" && Object.keys(byPlatform).length > 0) {
    return platforms.reduce(
      (sum, p) => sum + (postCountSchema.safeParse(byPlatform[p]).success ? (byPlatform[p] as number) : 1),
      0
    );
  }
  return platforms.length * (data.postsPerPlatform ?? 1);
}

export const createProjectSchema = z
  .object({
    title: z.string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters"),
    sourceContent: z
      .string()
      .max(10000, "Content must be less than 10,000 characters")
      .optional()
      .transform((v) => v ?? ""),
    platforms: z.array(platformEnum).min(1, "Select at least one platform").max(7, "Maximum 7 platforms allowed"),
    postsPerPlatform: postsPerPlatformSchema,
    postsPerPlatformByPlatform: postsPerPlatformByPlatformSchema,
  })
  .refine(
    (data) => !data.sourceContent || data.sourceContent.length >= 10,
    { message: "Content must be at least 10 characters when provided", path: ["sourceContent"] }
  )
  .refine(
    (data) => totalOutputsFromData(data) <= 10,
    { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
  )
  .refine(
    (data) => {
      const byPlatform = data.postsPerPlatformByPlatform;
      if (!byPlatform || typeof byPlatform !== "object" || Array.isArray(byPlatform)) return true;
      const platformsSet = new Set(data.platforms ?? []);
      return Object.keys(byPlatform).every((key) => platformsSet.has(key as z.infer<typeof platformEnum>));
    },
    { message: "postsPerPlatformByPlatform keys must be in selected platforms", path: ["postsPerPlatformByPlatform"] }
  );

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Schema for the "text" create form: sourceContent required (min 10 chars).
 * Use in ProjectForm when creating a text project so empty field is rejected.
 */
export const createProjectSchemaForTextForm = z
  .object({
    title: z.string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters"),
    sourceContent: z.string()
      .min(10, "Content must be at least 10 characters")
      .max(10000, "Content must be less than 10,000 characters"),
    platforms: z.array(platformEnum).min(1, "Select at least one platform").max(7, "Maximum 7 platforms allowed"),
    postsPerPlatform: postsPerPlatformSchema,
    postsPerPlatformByPlatform: postsPerPlatformByPlatformSchema,
  })
  .refine(
    (data) => totalOutputsFromData(data) <= 10,
    { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
  )
  .refine(
    (data) => {
      const byPlatform = data.postsPerPlatformByPlatform;
      if (!byPlatform || typeof byPlatform !== "object" || Array.isArray(byPlatform)) return true;
      const platformsSet = new Set(data.platforms ?? []);
      return Object.keys(byPlatform).every((key) => platformsSet.has(key as z.infer<typeof platformEnum>));
    },
    { message: "postsPerPlatformByPlatform keys must be in selected platforms", path: ["postsPerPlatformByPlatform"] }
  );

export type CreateProjectFormData = z.infer<typeof createProjectSchemaForTextForm>;

/**
 * Validation schema for project updates
 */
export const updateProjectSchema = z
  .object({
    title: z.string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters")
      .optional(),
    sourceContent: z.string()
      .min(10, "Content must be at least 10 characters")
      .max(10000, "Content must be less than 10,000 characters")
      .optional(),
    platforms: z.array(platformEnum).min(1, "Select at least one platform").max(7, "Maximum 7 platforms allowed").optional(),
    postsPerPlatform: postsPerPlatformSchema,
    postsPerPlatformByPlatform: postsPerPlatformByPlatformSchema,
    confirmDeleteExtraPosts: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const platforms = data.platforms ?? [];
      if (platforms.length === 0) return true;
      const total = totalOutputsFromData({
        platforms,
        postsPerPlatform: data.postsPerPlatform,
        postsPerPlatformByPlatform: data.postsPerPlatformByPlatform,
      });
      return total <= 10;
    },
    { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
  )
  .refine(
    (data) => {
      const byPlatform = data.postsPerPlatformByPlatform;
      if (!byPlatform || typeof byPlatform !== "object" || Array.isArray(byPlatform)) return true;
      const platforms = data.platforms ?? [];
      if (platforms.length === 0) return true;
      const platformsSet = new Set(platforms);
      return Object.keys(byPlatform).every((key) => platformsSet.has(key as z.infer<typeof platformEnum>));
    },
    { message: "postsPerPlatformByPlatform keys must be in selected platforms", path: ["postsPerPlatformByPlatform"] }
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Validation schema for bulk operations
 */
export const bulkOperationSchema = z.object({
  projectIds: z.array(z.string()).min(1).max(100),
});

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;