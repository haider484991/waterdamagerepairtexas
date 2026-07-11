import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Your Business – Verify Ownership",
  description:
    "Claim your business listing on Water Damage Repair USA to manage your profile, respond to reviews, and reach more customers. Verify ownership today.",
};

export default function ClaimBusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
