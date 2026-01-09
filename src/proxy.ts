import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;
const MAX_AUTH_ATTEMPTS = 10;

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0] : "unknown";
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= max) return false;
  record.count++;
  return true;
}

// Custom proxy function with rate limiting
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const key = getRateLimitKey(request);
    // Only rate limit actual login attempts (POST to callback), not session checks
    const isLoginAttempt = pathname.includes("/api/auth/callback") && request.method === "POST";
    const max = isLoginAttempt ? MAX_AUTH_ATTEMPTS : MAX_REQUESTS;

    if (!checkRateLimit(isLoginAttempt ? `auth:${key}` : key, max)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  // Use NextAuth for authentication
  const session = await auth();

  // Admin routes require admin role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin/")) {
    if (!session?.user) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/?error=unauthorized", request.url));
    }
  }

  // Dashboard routes require authentication
  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected API routes
  if (
    pathname.startsWith("/api/favorites/") ||
    pathname.startsWith("/api/reviews/") ||
    pathname.startsWith("/api/claims/")
  ) {
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/auth/:path*",
    "/api/favorites/:path*",
    "/api/reviews/:path*",
    "/api/claims/:path*",
    "/api/businesses/:path*",
    "/api/contact/:path*",
  ],
};
