import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  let token = null;
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    // If getToken fails (e.g. secret missing in Edge), allow request through
  }

  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") || 
      pathname.startsWith("/projects") || 
      pathname.startsWith("/settings")) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
