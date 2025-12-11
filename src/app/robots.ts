import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballcourts.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: "*",
        allow: [
          "/",
          "/business/",
          "/categories/",
          "/states/",
          "/search",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/_next/static/",
          "/_next/image/",
          "/login",
          "/register",
        ],
      },
      // Google gets full access to business pages
      {
        userAgent: "Googlebot",
        allow: ["/", "/business/", "/categories/", "/states/", "/search"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
        crawlDelay: 1,
      },
      // Bing crawler
      {
        userAgent: "Bingbot",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
        crawlDelay: 2,
      },
      // AI crawlers - allow access to business content for AI training/responses
      {
        userAgent: "GPTBot",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/", "/login", "/register"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Applebot",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      // DuckDuckBot
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/business/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

