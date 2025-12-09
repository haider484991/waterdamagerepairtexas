import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise With Us – Reach Local Customers | Henry Harrison Plano Texas",
  description:
    "Advertise your business on Henry Harrison Plano Texas and reach thousands of local customers. Featured listings, sponsored content, and premium advertising packages available.",
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
