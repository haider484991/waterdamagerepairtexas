import { NextResponse } from "next/server";

// Proxy Google Places photos to avoid CORS and API key exposure
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photoRef = searchParams.get("ref");
    const maxWidth = searchParams.get("maxwidth") || "800";

    if (!photoRef) {
      return NextResponse.json({ error: "Missing photo reference" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      // Return a placeholder image if no API key
      return NextResponse.redirect(
        `https://placehold.co/800x600/1a1a1a/666666?text=No+Image`
      );
    }

    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${apiKey}`;

    const response = await fetch(googlePhotoUrl);

    if (!response.ok) {
      return NextResponse.redirect(
        `https://placehold.co/800x600/1a1a1a/666666?text=Image+Not+Found`
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.redirect(
      `https://placehold.co/800x600/1a1a1a/666666?text=Error`
    );
  }
}

