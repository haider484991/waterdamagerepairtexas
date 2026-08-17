import { NextResponse } from "next/server";
import { getBusinessBySlug, getBusinessByPlaceId } from "@/lib/local-data";

/**
 * Serves a listed company's own phone number, on demand.
 *
 * The number deliberately does not ship with the page. Embedding it in the
 * HTML — even only inside the RSC flight payload — meant crawlers and AI
 * assistants (GPTBot, Claude-Web and friends are all allowed in robots.txt)
 * could read it straight out of the source and answer "what is X's number?"
 * without anyone visiting. It is now fetched only when a real visitor clicks
 * "Show phone number", and this route is disallowed in robots.txt via /api/.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = getBusinessBySlug(slug) ?? getBusinessByPlaceId(slug);
  if (!business?.phone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { phone: business.phone },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
