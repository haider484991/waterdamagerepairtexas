import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Header, Footer, MobileNav } from "@/components/layout";
import { generateSiteMetadata } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = generateSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <Toaster position="top-right" />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  ); 
}
