import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Write a Review | Water Damage Repair USA",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
