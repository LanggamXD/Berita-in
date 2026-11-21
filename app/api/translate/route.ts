import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

// ─── Rate Limiter Configuration ───────────────────────────────────────────────
// In-memory rate limiting: max 60 requests per minute per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

// ─── Server-side Translation Cache ───────────────────────────────────────────
// In-memory LRU-like cache: capped at 1,000 entries
const MAX_CACHE_SIZE = 1000;
const serverCache = new Map<string, string>();

function getCachedTranslation(word: string): string | undefined {
  const cached = serverCache.get(word);
  if (cached) {
    // Refresh access order (delete and re-insert)
    serverCache.delete(word);
    serverCache.set(word, cached);
  }
  return cached;
}

function setCachedTranslation(word: string, translation: string): void {
  if (serverCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = serverCache.keys().next().value;
    if (oldestKey) {
      serverCache.delete(oldestKey);
    }
  }
  serverCache.set(word, translation);
}

// ─── Upstream Google Translate Fetcher ─────────────────────────────────────────
function fetchGoogleTranslate(word: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(
    word
  )}`;

  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "*/*",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Upstream returned HTTP ${res.statusCode}`));
          }

          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              let translation = "";
              if (Array.isArray(json) && Array.isArray(json[0])) {
                translation = json[0]
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((segment: any) =>
                    Array.isArray(segment) ? segment[0] : ""
                  )
                  .join("")
                  .trim();
              }

              if (translation) {
                resolve(translation);
              } else {
                reject(new Error("Empty translation"));
              }
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
}

// ─── GET /api/translate ───────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawWord = request.nextUrl.searchParams.get("word") || "";

  // 1. Strict Input Validation & Normalization
  // Trim, lowercase, and strip surrounding punctuation (quotes, brackets, punctuation)
  const normalized = rawWord
    .trim()
    .toLowerCase()
    .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");

  if (!normalized || !/^[a-zA-Z'-]{1,40}$/.test(normalized)) {
    return NextResponse.json(
      { error: "Invalid English word parameter" },
      { status: 400 }
    );
  }

  // 2. Rate Limiting Check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "client";

  const now = Date.now();
  const rateEntry = rateLimitMap.get(ip);

  if (rateEntry) {
    if (now > rateEntry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (rateEntry.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Too many translation requests. Please wait a moment." },
          { status: 429 }
        );
      }
      rateEntry.count += 1;
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Periodic cleanup if rateLimitMap grows large
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  // 3. In-Memory Server Cache Lookup
  const cachedTranslation = getCachedTranslation(normalized);
  if (cachedTranslation) {
    return NextResponse.json(
      { word: normalized, translation: cachedTranslation, cached: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        },
      }
    );
  }

  // 4. Upstream Google Translate Fetch (EN -> ID)
  try {
    const translation = await fetchGoogleTranslate(normalized);

    // Save into server cache
    setCachedTranslation(normalized, translation);

    return NextResponse.json(
      { word: normalized, translation, cached: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (err) {
    console.error("[Translation API] Failed to fetch translation:", err);
    return NextResponse.json(
      { error: "Upstream translation error" },
      { status: 502 }
    );
  }
}
