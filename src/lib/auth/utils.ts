import { auth } from "./index";

/**
 * Check if a user is an admin based on their session
 */
export async function isAdmin() {
  const session = await auth();
  
  if (!session?.user) return false;
  
  // Check role first (recommended)
  if (session.user.role === "admin") return true;
  
  // Fallback to email list for existing setups
  const adminEmails = [
    "admin@waterdamagerepairtexas.net",
    "owner@waterdamagerepairtexas.net",
    "admin@test.com",
  ];
  
  if (session.user.email && adminEmails.includes(session.user.email)) {
    return true;
  }
  
  // Specific email patterns
  if (session.user.email?.endsWith("@admin.com")) {
    return true;
  }
  
  return false;
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
