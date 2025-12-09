import { NextResponse } from "next/server";
import { getSyncProgress } from "@/lib/sync-progress";

export async function GET() {
  try {
    const progress = getSyncProgress();
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching sync progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
