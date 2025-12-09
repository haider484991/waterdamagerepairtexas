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
    title: `${neighborhoodName} – Businesses & Services | Henry Harrison Plano Texas`,
    description: `Discover local businesses in ${neighborhoodName}, Plano, Texas. Find restaurants, shops, services, and more in this vibrant neighborhood.`,
  };
}

export default function NeighborhoodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
