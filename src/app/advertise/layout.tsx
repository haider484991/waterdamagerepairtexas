import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise With Us – Reach Pickleball Players Nationwide | US Pickleball Directory",
  description:
    "Advertise your pickleball business on US Pickleball Directory and reach thousands of players across the United States. Featured listings, sponsored content, and premium advertising packages available.",
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
