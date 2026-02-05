import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Require admin role for server components and API routes.
 * Returns session if user is admin; otherwise redirects (pages) or throws (API can use result to send 403).
 */
type SessionUserWithRole = Session["user"] & { role?: string };

export function requireAdmin(session: Session | null): Session {
  if (!session?.user) {
    redirect("/login");
  }
  if ((session.user as SessionUserWithRole).role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Check if current session is admin. Use in API routes to return 403 JSON.
 */
export function isAdmin(session: Session | null): boolean {
  return !!session?.user && (session.user as SessionUserWithRole).role === "admin";
}
