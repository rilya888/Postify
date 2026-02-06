import { z } from "zod";

/**
 * Validation schema for project creation (API).
 * sourceContent is optional: empty/missing allowed for "audio-first" flow; when provided, min 10 chars.
 */
const postsPerPlatformSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]).optional();

export const createProjectSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  sourceContent: z
    .string()
    .max(10000, "Content must be less than 10,000 characters")
    .optional()
    .transform((v) => v ?? ""),
  platforms: z.array(z.enum(["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"]))
    .min(1, "Select at least one platform")
    .max(7, "Maximum 7 platforms allowed"),
  postsPerPlatform: postsPerPlatformSchema,
}).refine(
  (data) => !data.sourceContent || data.sourceContent.length >= 10,
  { message: "Content must be at least 10 characters when provided", path: ["sourceContent"] }
).refine(
  (data) => (data.platforms?.length ?? 0) * (data.postsPerPlatform ?? 1) <= 10,
  { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Schema for the "text" create form: sourceContent required (min 10 chars).
 * Use in ProjectForm when creating a text project so empty field is rejected.
 */
export const createProjectSchemaForTextForm = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  sourceContent: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10,000 characters"),
  platforms: z.array(z.enum(["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"]))
    .min(1, "Select at least one platform")
    .max(7, "Maximum 7 platforms allowed"),
  postsPerPlatform: postsPerPlatformSchema,
}).refine(
  (data) => (data.platforms?.length ?? 0) * (data.postsPerPlatform ?? 1) <= 10,
  { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
);

export type CreateProjectFormData = z.infer<typeof createProjectSchemaForTextForm>;

/**
 * Validation schema for project updates
 */
export const updateProjectSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  sourceContent: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10,000 characters")
    .optional(),
  platforms: z.array(z.enum(["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"]))
    .min(1, "Select at least one platform")
    .max(7, "Maximum 7 platforms allowed")
    .optional(),
  postsPerPlatform: postsPerPlatformSchema,
  confirmDeleteExtraPosts: z.boolean().optional(),
}).refine(
  (data) => {
    const platforms = data.platforms;
    const n = data.postsPerPlatform ?? 1;
    if (!platforms || platforms.length === 0) return true;
    return platforms.length * n <= 10;
  },
  { message: "Platforms × posts per platform cannot exceed 10", path: ["postsPerPlatform"] }
);

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Validation schema for bulk operations
 */
export const bulkOperationSchema = z.object({
  projectIds: z.array(z.string()).min(1).max(100),
});

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;