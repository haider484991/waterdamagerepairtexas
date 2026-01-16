export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://www.waterdamagerepair.io";

  const trimmed = raw.trim().replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    try {
      const u = new URL(trimmed);
      const host = u.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
        return "https://www.waterdamagerepair.io";
      }
    } catch {
      return "https://www.waterdamagerepair.io";
    }
  }

  return trimmed || "https://www.waterdamagerepair.io";
}
