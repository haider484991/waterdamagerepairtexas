import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "Search Water Damage Services — Find Restoration Professionals | Water Damage Repair USA",
  description:
    "Search for water damage restoration, flood cleanup, mold remediation, and emergency water services across the USA. Filter by state, category, and rating.",
  keywords: [
    "search water damage services",
    "find water damage restoration",
    "water damage restoration near me",
    "flood cleanup services",
    "mold remediation near me",
    "emergency water damage repair",
  ],
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  openGraph: {
    title: "Search Water Damage Services — Water Damage Repair USA",
    description:
      "Search for water damage restoration, flood cleanup, mold remediation, and emergency water services across the USA.",
    url: `${SITE_URL}/search`,
    type: "website",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
