import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Require admin role for server components and API routes.
 * Returns session if user is admin; otherwise redirects (pages) or throws (API can use result to send 403).
 * Admin = session.user.role === "admin" OR session.user.email in ADMIN_EMAILS (so no re-login after setting env).
 */
type SessionUserWithRole = Session["user"] & { role?: string };

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(session: Session | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as SessionUserWithRole).role;
  if (role === "admin") return true;
  const email = session.user.email?.toLowerCase();
  return !!email && getAdminEmails().includes(email);
}

export function requireAdmin(session: Session | null): Session {
  if (!session?.user) {
    redirect("/login");
  }
  if (!isAdminUser(session)) {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Check if current session is admin. Use in API routes to return 403 JSON.
 */
export function isAdmin(session: Session | null): boolean {
  return isAdminUser(session);
}
