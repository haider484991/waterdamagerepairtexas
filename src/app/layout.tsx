import type { Metadata } from "next";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Header, Footer, MobileNav } from "@/components/layout";
import { generateSiteMetadata } from "@/lib/seo";
import { generateOrganizationSchema, generateWebSiteSchema, generateHowToSchema } from "@/lib/seo/schema-markup";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = generateSiteMetadata();

// Generate global schemas for the entire site
const organizationSchema = generateOrganizationSchema();
const webSiteSchema = generateWebSiteSchema();
const howToSchema = generateHowToSchema();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Global Organization Schema for E-E-A-T signals */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* WebSite Schema with SearchAction for sitelinks search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        {/* HowTo Schema for AI search engines answering "how to" queries */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      </head>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-DTHG4XX0GK" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-DTHG4XX0GK');
        `}
      </Script>
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="DWNLXGPmrWIQQPPXr+HyLQ"
        async
      />
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
