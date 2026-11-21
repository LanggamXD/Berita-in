import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

// ─── Rate Limiter Configuration ───────────────────────────────────────────────
// In-memory rate limiting: max 20 batch requests per minute per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const batchRateLimitMap = new Map<string, RateLimitEntry>();
const BATCH_WINDOW_MS = 60 * 1000; // 1 minute
const BATCH_MAX_REQUESTS = 20; // 20 requests per minute

// ─── Server-side Translation Cache ───────────────────────────────────────────
// In-memory LRU-like cache: capped at 1,000 entries
const MAX_CACHE_SIZE = 1000;
const serverCache = new Map<string, string>();

function getCached(text: string): string | undefined {
  const cached = serverCache.get(text);
  if (cached) {
    // Refresh access order (delete and re-insert)
    serverCache.delete(text);
    serverCache.set(text, cached);
  }
  return cached;
}

function setCached(text: string, translation: string): void {
  if (serverCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = serverCache.keys().next().value;
    if (oldestKey) {
      serverCache.delete(oldestKey);
    }
  }
  serverCache.set(text, translation);
}

// ─── Upstream Single Text Fetcher ─────────────────────────────────────────────
function fetchGoogleTranslateFull(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(
    text
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
              // Parse ALL sentence segments so multi-sentence summaries are never cut off
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

// ─── Controlled Concurrency Chunking ──────────────────────────────────────────
async function translateBatch(
  uncachedTexts: string[],
  concurrency = 5
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (let i = 0; i < uncachedTexts.length; i += concurrency) {
    const chunk = uncachedTexts.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (text) => {
        try {
          const translation = await fetchGoogleTranslateFull(text);
          results.set(text, translation);
          setCached(text, translation);
        } catch (err) {
          console.warn(`[Batch Translate] Error translating "${text.slice(0, 40)}":`, err);
          // Graceful fallback to original text if upstream fails for this segment
          results.set(text, text);
        }
      })
    );
  }

  return results;
}

// ─── POST /api/translate/batch ────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { texts?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // 1. Strict Input Validation
  if (
    !body ||
    !Array.isArray(body.texts) ||
    body.texts.length === 0 ||
    body.texts.length > 60
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid payload: 'texts' must be an array of 1 to 60 string items",
      },
      { status: 400 }
    );
  }

  const sanitizedTexts: string[] = [];
  for (const item of body.texts) {
    if (typeof item !== "string") {
      return NextResponse.json(
        { error: "Each item in 'texts' must be a string" },
        { status: 400 }
      );
    }
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Text items cannot be empty and must not exceed 1000 characters",
        },
        { status: 400 }
      );
    }
    sanitizedTexts.push(trimmed);
  }

  // 2. Rate Limiting Check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "client";

  const now = Date.now();
  const rateEntry = batchRateLimitMap.get(ip);

  if (rateEntry) {
    if (now > rateEntry.resetAt) {
      batchRateLimitMap.set(ip, { count: 1, resetAt: now + BATCH_WINDOW_MS });
    } else {
      if (rateEntry.count >= BATCH_MAX_REQUESTS) {
        return NextResponse.json(
          {
            error:
              "Too many batch translation requests. Please wait a minute.",
          },
          { status: 429 }
        );
      }
      rateEntry.count += 1;
    }
  } else {
    batchRateLimitMap.set(ip, { count: 1, resetAt: now + BATCH_WINDOW_MS });
  }

  // Periodic cleanup if rate limit map grows large
  if (batchRateLimitMap.size > 1000) {
    for (const [key, value] of batchRateLimitMap.entries()) {
      if (now > value.resetAt) {
        batchRateLimitMap.delete(key);
      }
    }
  }

  // 3. Cache Partitioning
  const translations: Record<string, string> = {};
  const uncachedSet = new Set<string>();

  for (const text of sanitizedTexts) {
    const cached = getCached(text);
    if (cached) {
      translations[text] = cached;
    } else {
      uncachedSet.add(text);
    }
  }

  // 4. Batch Translation for Uncached Items
  if (uncachedSet.size > 0) {
    const uncachedList = Array.from(uncachedSet);
    const newlyTranslated = await translateBatch(uncachedList, 5);

    for (const [text, translation] of newlyTranslated.entries()) {
      translations[text] = translation;
    }
  }

  return NextResponse.json(
    { translations },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    }
  );
}
