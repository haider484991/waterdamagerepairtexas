import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const neighborhoodName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${neighborhoodName} Water Damage Restoration Services | Water Damage Repair USA`,
    description: `Find trusted water damage restoration professionals in ${neighborhoodName}. Emergency flood cleanup, water extraction, and mold remediation services available 24/7.`,
  };
}

export default function NeighborhoodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
