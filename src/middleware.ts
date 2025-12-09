export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/favorites/:path*",
    "/api/reviews/:path*",
    "/api/claims/:path*",
  ],
};

