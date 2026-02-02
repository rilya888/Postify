import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// Simple in-memory rate limiter (for demo purposes)
// In production, use a distributed store like Redis
const rateLimitMap = new Map();

// Rate limit configuration
const MAX_REQUESTS = 100; // Max requests per window
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    // First request from this IP
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + TIME_WINDOW,
    });
    return false;
  }

  if (now > record.resetTime) {
    // Reset the counter after the time window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + TIME_WINDOW,
    });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    return true;
  }

  // Increment the counter
  rateLimitMap.set(identifier, {
    count: record.count + 1,
    resetTime: record.resetTime,
  });

  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Apply rate limiting to all requests
  const ip = req.ip ?? "127.0.0.1";
  if (isRateLimited(ip)) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects") || pathname.startsWith("/settings")) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Add security headers to all responses
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
