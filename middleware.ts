import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const normalizedPathname = pathname;
  const isLoggedIn = !!req.auth;

  // Protect dashboard and admin routes (role check is in admin layout)
  if (
    normalizedPathname.startsWith("/dashboard") ||
    normalizedPathname.startsWith("/projects") ||
    normalizedPathname.startsWith("/settings") ||
    normalizedPathname.startsWith("/admin")
  ) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if ((normalizedPathname === "/login" || normalizedPathname === "/signup") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.openai.com; frame-ancestors 'none'; object-src 'none';"
  );

  // X-Frame-Options
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Cross-Origin-Embedder-Policy
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

  // Cross-Origin-Opener-Policy
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // Cross-Origin-Resource-Policy
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
