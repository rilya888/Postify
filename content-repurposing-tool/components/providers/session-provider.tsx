"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Session provider wrapper for NextAuth
 * Makes session available to all client components via useSession hook
 * 
 * Usage: Wrap app in root layout
 * <SessionProvider>
 *   {children}
 * </SessionProvider>
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
