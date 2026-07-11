import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise With Us – Reach Property Owners Nationwide",
  description:
    "Advertise your water damage restoration business on Water Damage Repair USA and reach thousands of property owners nationwide. Featured listings, sponsored content, and premium advertising packages available.",
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
