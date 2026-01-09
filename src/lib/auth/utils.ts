import { auth } from "./index";

/**
 * Check if a user is an admin based on their session
 * Only checks the role field - no email-based fallbacks for security
 */
export async function isAdmin() {
  const session = await auth();

  if (!session?.user) return false;

  // Only check role - strict admin verification
  return session.user.role === "admin";
}

/**
 * Higher-order function to protect API routes
 */
export async function verifyAdmin() {
  const isAuthorized = await isAdmin();
  if (!isAuthorized) {
    throw new Error("Unauthorized - Admin access required");
  }
  return true;
}
