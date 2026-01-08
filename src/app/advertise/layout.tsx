import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise With Us – Reach Texas Property Owners | Water Damage Repair Texas",
  description:
    "Advertise your water damage restoration business on Water Damage Repair Texas and reach thousands of property owners across Texas. Featured listings, sponsored content, and premium advertising packages available.",
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
