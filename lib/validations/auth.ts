import { z } from "zod";

/**
 * Validation schema for user login
 * Used in login form and API endpoint
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validation schema for user registration
 * Used in signup form and API endpoint
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for password reset (future feature)
 */
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
