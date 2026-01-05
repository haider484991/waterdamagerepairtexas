import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

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
          "/blog",
          "/blog/",
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
      // Google gets full access to business pages and blog
      {
        userAgent: "Googlebot",
        allow: ["/", "/business/", "/categories/", "/states/", "/search", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
        crawlDelay: 1,
      },
      // Bing crawler
      {
        userAgent: "Bingbot",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
        crawlDelay: 2,
      },
      // AI crawlers - allow access to business content and blog for AI training/responses
      {
        userAgent: "GPTBot",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/", "/login", "/register"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Applebot",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      // DuckDuckBot
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/business/", "/categories/", "/blog", "/blog/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

