export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/favorites/:path*",
    "/api/reviews/:path*",
    "/api/claims/:path*",
  ],
};

