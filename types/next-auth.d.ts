import "next-auth";
import "next-auth/jwt";

/**
 * Extend NextAuth types to include user ID in session
 * This allows type-safe access to user.id in server components and API routes
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
  }
}
