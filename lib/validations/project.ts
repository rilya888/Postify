import { z } from "zod";
import { PLATFORMS } from "@/lib/constants/platforms";

/**
 * Validation schema for project creation
 */
export const createProjectSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  sourceContent: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10,000 characters"),
  platforms: z.array(z.enum(["linkedin", "twitter", "email"]))
    .min(1, "Select at least one platform")
    .max(3, "Maximum 3 platforms allowed"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

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
  platforms: z.array(z.enum(["linkedin", "twitter", "email"]))
    .min(1, "Select at least one platform")
    .max(3, "Maximum 3 platforms allowed")
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Validation schema for bulk operations
 */
export const bulkOperationSchema = z.object({
  projectIds: z.array(z.string()).min(1).max(100),
});

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;