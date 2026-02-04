import { handlers } from "@/lib/auth/config";

/**
 * NextAuth API route handler
 * Handles all authentication requests:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 */
export const { GET, POST } = handlers;
