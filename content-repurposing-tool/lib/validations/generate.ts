import { z } from "zod";

const platformEnum = z.enum([
  "linkedin",
  "twitter",
  "email",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
]);

/**
 * Validation schema for POST /api/generate body.
 * Max length for sourceContent is enforced in the route after plan is known.
 */
export const generateBodySchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  platforms: z.array(platformEnum).min(1, "Select at least one platform").max(7, "Maximum 7 platforms allowed"),
  sourceContent: z
    .string()
    .min(1, "Source content cannot be empty")
    .refine((s) => s.trim().length > 0, "Source content cannot be empty"),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(5000).optional(),
      model: z.string().optional(),
    })
    .optional(),
  brandVoiceId: z.string().optional(),
});

export type GenerateBodyInput = z.infer<typeof generateBodySchema>;
