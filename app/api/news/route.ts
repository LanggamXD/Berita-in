import { type NextRequest, NextResponse } from "next/server";
import { fetchNewsForDate, buildAvailableDates, isDateInWindow } from "@/lib/wikipedia";
import type { DailyNewsResponse } from "@/types/news";

/**
 * GET /api/news
 *
 * Query params:
 *   date     YYYY-MM-DD  - which day to fetch (defaults to today UTC)
 *   refresh  "1"         - bypass cache and fetch fresh from Wikipedia
 *
 * Protected by proxy.ts — already requires valid auth cookie.
 * Returns DailyNewsResponse JSON or error JSON.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const rawDate = searchParams.get("date");
  const refresh = searchParams.get("refresh") === "1";

  // ── Determine date ──────────────────────────────────────────────────────
  let dateStr: string;

  if (rawDate) {
    // Validate format and 7-day window
    if (!isDateInWindow(rawDate)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Invalid date. Must be in YYYY-MM-DD format and within the last 7 days.",
        },
        { status: 400 }
      );
    }
    dateStr = rawDate;
  } else {
    // Default to today (UTC)
    const now = new Date();
    dateStr = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
      .toISOString()
      .slice(0, 10);
  }

  // ── Fetch data ──────────────────────────────────────────────────────────
  try {
    const data: DailyNewsResponse = await fetchNewsForDate(dateStr, refresh);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Advise downstream clients on max-age; revalidation is handled server-side
        "Cache-Control": refresh
          ? "no-store"
          : "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[/api/news] Upstream Wikipedia fetch failed:", err);
    return NextResponse.json(
      {
        error: "Bad Gateway",
        message:
          "Wikipedia is currently unreachable. Please try again in a few moments.",
        availableDates: buildAvailableDates(),
      },
      { status: 502 }
    );
  }
}
