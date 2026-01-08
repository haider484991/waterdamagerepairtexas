/**
 * RSS Feed Route
 * 
 * Generates an RSS 2.0 feed for blog posts
 */

import { NextResponse } from "next/server";
import { db, blogPosts } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const SITE_NAME = "Water Damage Repair Texas Blog";
const SITE_DESCRIPTION = "Expert tips, restoration guides, and the latest water damage news for Texas property owners.";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    // Get published posts
    const posts = await db
      .select({
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        publishedAt: blogPosts.publishedAt,
        updatedAt: blogPosts.updatedAt,
        contentHtml: blogPosts.contentHtml,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(50);

    const lastBuildDate = posts[0]?.publishedAt || new Date();

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/water-damage-logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <pubDate>${(post.publishedAt || new Date()).toUTCString()}</pubDate>
      ${post.contentHtml ? `<content:encoded><![CDATA[${post.contentHtml}]]></content:encoded>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    
    // Return minimal valid RSS on error
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
  </channel>
</rss>`;

    return new NextResponse(errorRss, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
