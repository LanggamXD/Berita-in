/**
 * Wikipedia Current Events Fetcher & Parser
 *
 * - Fetches from the official English Wikipedia MediaWiki API (server-side only)
 * - Uses cheerio for robust HTML parsing
 * - Sanitizes all output: strips HTML tags, validates URLs
 * - Handles missing pages (missingtitle) gracefully
 */

import * as cheerio from "cheerio";
import type {
  TrendingItem,
  NewsItem,
  NewsSource,
  DailyNewsResponse,
  AvailableDateEntry,
  MediaWikiError,
} from "@/types/news";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIAWIKI_API = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_ORIGIN = "https://en.wikipedia.org";
const USER_AGENT =
  "Berita-in/1.0 (Personal Daily News Reader; https://github.com/berita-in)";

/** Revalidation window for cached Wikipedia fetches: 6 hours (21600 seconds) */
const REVALIDATE_SECONDS = 21600;

// ─── Security Helpers ─────────────────────────────────────────────────────────

/**
 * Strips all HTML tags from a string, returning clean plain text.
 * Also collapses multiple whitespace and trims.
 */
export function stripHtml(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves relative Wikipedia links and validates the URL protocol.
 * Returns null for unsafe protocols (javascript:, data:, etc.)
 * Strictly allows only http: and https: protocols.
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  let resolved = url.trim();

  // Resolve relative /wiki/... or /w/... links
  if (resolved.startsWith("/wiki/") || resolved.startsWith("/w/")) {
    resolved = `${WIKIPEDIA_ORIGIN}${resolved}`;
  } else if (resolved.startsWith("//")) {
    resolved = `https:${resolved}`;
  }

  try {
    const parsed = new URL(resolved);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    // Explicitly reject javascript:, data:, file:, etc.
    return null;
  } catch {
    return null;
  }
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/** Month names as Wikipedia uses them in page titles (no leading zero on day) */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Formats a Date to Wikipedia's current events page title format.
 * e.g. "Portal:Current_events/2026_November_21" (no leading zero on day)
 */
function toWikiPageTitle(date: Date): string {
  const y = date.getUTCFullYear();
  const m = MONTH_NAMES[date.getUTCMonth()];
  const d = date.getUTCDate(); // no leading zero
  return `Portal:Current_events/${y}_${m}_${d}`;
}

/**
 * Formats a Date to ISO YYYY-MM-DD (UTC).
 */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Formats a Date to a human-readable display string.
 */
function toDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Builds the 7-day available-dates array starting from today (UTC).
 */
export function buildAvailableDates(): AvailableDateEntry[] {
  const now = new Date();
  const entries: AvailableDateEntry[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    const isoDate = toISODate(d);
    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Yesterday";
    else {
      label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    }
    entries.push({ date: isoDate, label });
  }

  return entries;
}

/**
 * Validates a date string against YYYY-MM-DD format AND the 7-day window.
 * Returns true if the date is valid and falls within [today - 6 days, today].
 */
export function isDateInWindow(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

  const requested = new Date(dateStr + "T00:00:00Z");
  if (isNaN(requested.getTime())) return false;

  return requested >= sixDaysAgo && requested <= today;
}

// ─── MediaWiki API Fetcher ────────────────────────────────────────────────────

interface MediaWikiParseResponse {
  parse?: { text?: { "*": string }; title?: string };
  error?: MediaWikiError;
}

/**
 * Fetches a Wikipedia page's rendered HTML via the MediaWiki parse API.
 * Returns the HTML string, or null if the page doesn't exist (missingtitle).
 * Throws on upstream 5xx or network errors.
 *
 * @param pageTitle The Wikipedia page title to fetch
 * @param noCache   Pass true to bypass the Next.js fetch cache (refresh=1)
 */
async function fetchWikipediaHtml(
  pageTitle: string,
  noCache = false
): Promise<string | null> {
  const url = new URL(MEDIAWIKI_API);
  url.searchParams.set("action", "parse");
  url.searchParams.set("format", "json");
  url.searchParams.set("prop", "text");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("origin", "*");

  const fetchOptions: RequestInit = {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    ...(noCache
      ? { cache: "no-store" as RequestCache }
      : {
          next: { revalidate: REVALIDATE_SECONDS },
        }),
  };

  const res = await fetch(url.toString(), fetchOptions);

  if (!res.ok) {
    throw new Error(
      `Wikipedia API responded with HTTP ${res.status} for page "${pageTitle}"`
    );
  }

  const json: MediaWikiParseResponse = await res.json();

  // Handle MediaWiki error — missingtitle means the page just doesn't exist yet
  if (json.error) {
    if (json.error.code === "missingtitle" || json.error.code === "invalidtitle") {
      return null;
    }
    throw new Error(`MediaWiki API error [${json.error.code}]: ${json.error.info}`);
  }

  return json.parse?.text?.["*"] ?? null;
}

// ─── Trending / Ongoing Events Parser ────────────────────────────────────────

/**
 * Fetches and parses Wikipedia's Ongoing Events.
 * Attempts Portal:Current_events/Ongoing_events first, then falls back to
 * the ongoing events section directly in Portal:Current_events.
 */
export async function fetchTrending(noCache = false): Promise<TrendingItem[]> {
  try {
    // 1. Try dedicated subpage first
    let html = await fetchWikipediaHtml(
      "Portal:Current_events/Ongoing_events",
      noCache
    );

    // 2. Fallback to main portal if subpage doesn't exist (as is current Wikipedia layout)
    if (!html) {
      html = await fetchWikipediaHtml("Portal:Current_events", noCache);
    }

    if (!html) return [];
    return parseTrending(html);
  } catch (err) {
    console.warn("[berita-in] Failed to fetch trending events:", err);
    return [];
  }
}

/**
 * Parses Wikipedia HTML for ongoing events.
 * Handles both the current-events-sidebar collapsible structure and .itn-footer fallback.
 */
function parseTrending(html: string): TrendingItem[] {
  const $ = cheerio.load(html);
  const items: TrendingItem[] = [];

  // Strategy 1: Look inside div.current-events-sidebar or #Ongoing_events container
  const sidebar = $(
    ".current-events-sidebar, #Ongoing_events, .mw-collapsible"
  )
    .first()
    .closest(".current-events-sidebar, .mw-collapsible, div:has(#Ongoing_events)");

  if (sidebar.length > 0) {
    let currentCategory = "Ongoing";

    sidebar.find("h3, .mw-html-heading, dl, ul").each((_i, el) => {
      const $el = $(el);
      if ($el.is("h3") || $el.find("h3").length > 0) {
        const cat = stripHtml($el.text());
        if (cat) currentCategory = cat;
      } else if ($el.is("ul")) {
        $el.find("> li").each((_j, li) => {
          const $li = $(li);
          const firstLink = $li.find("a[href]").first();
          const rawTitle = $li.text().replace(/\s+/g, " ").trim();
          const title = stripHtml(rawTitle);
          const href = firstLink.attr("href") || "";

          if (title && href) {
            const url = sanitizeUrl(href) ?? `${WIKIPEDIA_ORIGIN}/wiki/Portal:Current_events`;
            items.push({
              id: `trending-${items.length}`,
              title,
              category: currentCategory,
              url,
            });
          }
        });
      }
    });
  }

  // Strategy 2: If none found in sidebar, check .itn-footer (In the news footer box)
  if (items.length === 0) {
    $(".itn-footer").find("li a").each((_i, a) => {
      const $a = $(a);
      const title = stripHtml($a.text());
      const href = $a.attr("href") || "";
      if (title && href && !title.toLowerCase().includes("nominate")) {
        const url = sanitizeUrl(href) ?? `${WIKIPEDIA_ORIGIN}/wiki/Portal:Current_events`;
        items.push({
          id: `trending-${items.length}`,
          title,
          category: "Ongoing",
          url,
        });
      }
    });
  }

  // Strategy 3: General li search if still empty (subpage case)
  if (items.length === 0) {
    $("li").each((_i, el) => {
      const $el = $(el);
      const rawText = $el.text().trim();
      if (!rawText || rawText.length < 5 || rawText.length > 250) return;

      const firstLink = $el.find("a[href]").first();
      const href = firstLink.attr("href") || "";
      const url = sanitizeUrl(href);
      if (!url) return;

      const title = stripHtml(rawText);
      if (title) {
        items.push({
          id: `trending-${items.length}`,
          title,
          category: "Ongoing",
          url,
        });
      }
    });
  }

  return items.slice(0, 30); // cap at reasonable limit
}

// ─── Daily News Parser ────────────────────────────────────────────────────────

/**
 * Fetches and parses a specific day's current events page.
 * Returns an empty items array if the page doesn't exist yet (e.g. early today).
 */
export async function fetchDailyNews(
  dateStr: string, // YYYY-MM-DD
  noCache = false
): Promise<NewsItem[]> {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const pageTitle = toWikiPageTitle(date);

  try {
    const html = await fetchWikipediaHtml(pageTitle, noCache);
    if (!html) return []; // Page doesn't exist yet — gracefully return empty array
    return parseDailyNews(html);
  } catch (err) {
    console.warn(`[berita-in] Failed to fetch news for ${dateStr}:`, err);
    return [];
  }
}

/**
 * Parses Wikipedia's current events daily page HTML into structured NewsItems.
 *
 * Real Wikipedia Daily Page HTML layout:
 *   <div class="current-events-content description">
 *     <p><b>Armed conflicts and attacks</b></p>
 *     <ul>
 *       <li>Parent topic
 *         <ul>
 *           <li>Subtopic
 *             <ul>
 *               <li>News sentence text... <a href="..." class="external text">(Source)</a></li>
 *             </ul>
 *           </li>
 *         </ul>
 *       </li>
 *     </ul>
 *     <p><b>Disasters and accidents</b></p>
 *     ...
 *   </div>
 */
function parseDailyNews(html: string): NewsItem[] {
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];

  // Locate the current-events-content container
  const container = $(
    ".current-events-content.description, .current-events-content"
  ).first();

  if (container.length === 0) {
    // If not found in standard container, fallback to general container or return empty
    return parseDailyNewsFallback($);
  }

  let currentCategory = "General";
  let itemIndex = 0;

  container.children().each((_i, el) => {
    const $el = $(el);

    // 1. Detect Category Heading: <p><b>Category</b></p> or <h2/h3/dt>
    if ($el.is("p") && $el.find("b, strong").length > 0) {
      const catText = stripHtml($el.find("b, strong").first().text());
      if (catText && catText.length > 1 && catText.length < 120) {
        currentCategory = catText;
      }
    } else if ($el.is("h2, h3, h4, dt")) {
      const catText = stripHtml($el.text());
      if (catText && catText.length > 1 && catText.length < 120) {
        currentCategory = catText;
      }
    } else if ($el.is("ul")) {
      // 2. Process list items under this category
      $el.find("li").each((_j, li) => {
        const $li = $(li);

        // Skip parent <li> that only contain nested <ul> (we want the leaf items with news)
        if ($li.children("ul").length > 0) {
          return;
        }

        // Extract sources: external links (non-Wikipedia)
        const sources: NewsSource[] = [];
        $li.find("a[href]").each((_k, a) => {
          const $a = $(a);
          const href = $a.attr("href") || "";
          const text = stripHtml($a.text());

          if (href.startsWith("http://") || href.startsWith("https://")) {
            // Check if it's an external news source (not an internal wikipedia link)
            if (!href.includes("wikipedia.org") && !href.includes("wikimedia.org")) {
              const safeUrl = sanitizeUrl(href);
              if (safeUrl) {
                // Strip surrounding parentheses from source name, e.g. "(Reuters)" -> "Reuters"
                const cleanName = text.replace(/^\(|\)$/g, "").trim();
                sources.push({
                  name: cleanName || "Source",
                  url: safeUrl,
                });
              }
            }
          }
        });

        // Extract summary: clone to avoid modifying original, remove any nested tags if any
        let rawSummary = $li.clone().find("ul").remove().end().text().trim();

        // Strip trailing source citation patterns like "(Reuters)" "(BBC News) (Al Jazeera)"
        rawSummary = rawSummary
          .replace(/\s*\([^)]{1,80}\)\s*$/g, "")
          .replace(/\s*\([^)]{1,80}\)\s*$/g, "")
          .replace(/\s*\[[^\]]*\]\s*/g, "") // remove [1] reference citations
          .replace(/\s+/g, " ")
          .trim();

        const summary = stripHtml(rawSummary);

        // Filter out empty or trivially short items
        if (summary && summary.length > 15) {
          items.push({
            id: `news-${itemIndex++}-${Date.now()}`,
            category: currentCategory,
            summary,
            sources,
          });
        }
      });
    }
  });

  return items;
}

/**
 * Fallback parser for alternative or older Wikipedia HTML layouts
 */
function parseDailyNewsFallback($: cheerio.CheerioAPI): NewsItem[] {
  const items: NewsItem[] = [];
  let currentCategory = "General";
  let itemIndex = 0;

  // Walk through dt/dd pairs if present in old archive layouts
  $("dl").each((_i, dl) => {
    $(dl).children().each((_j, child) => {
      const tagName = child.type === "tag" ? child.name : "";

      if (tagName === "dt") {
        const catText = stripHtml($(child).text());
        if (catText && catText.length > 1 && catText.length < 120) {
          currentCategory = catText;
        }
      } else if (tagName === "dd") {
        $(child).find("li").each((_k, li) => {
          const $li = $(li);
          if ($li.children("ul").length > 0) return;

          const sources: NewsSource[] = [];
          $li.find("a[href]").each((_l, a) => {
            const href = $(a).attr("href") || "";
            const text = stripHtml($(a).text());
            if (href.startsWith("http://") || href.startsWith("https://")) {
              if (!href.includes("wikipedia.org")) {
                const safeUrl = sanitizeUrl(href);
                if (safeUrl) {
                  sources.push({
                    name: text.replace(/^\(|\)$/g, "").trim() || "Source",
                    url: safeUrl,
                  });
                }
              }
            }
          });

          let raw = $li.text().trim();
          raw = raw
            .replace(/\s*\([^)]{1,80}\)\s*$/g, "")
            .replace(/\s*\([^)]{1,80}\)\s*$/g, "")
            .replace(/\s*\[[^\]]*\]\s*/g, "")
            .trim();

          const summary = stripHtml(raw);
          if (summary && summary.length > 15) {
            items.push({
              id: `news-${itemIndex++}-${Date.now()}`,
              category: currentCategory,
              summary,
              sources,
            });
          }
        });
      }
    });
  });

  return items;
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Fetches and assembles the full DailyNewsResponse for a given date.
 * This is the primary function called by the API route.
 */
export async function fetchNewsForDate(
  dateStr: string,
  noCache = false
): Promise<DailyNewsResponse> {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  const availableDates = buildAvailableDates();
  const displayDate = toDisplayDate(date);

  // Fetch trending and daily news in parallel
  const [trending, items] = await Promise.all([
    fetchTrending(noCache),
    fetchDailyNews(dateStr, noCache),
  ]);

  // Derive unique categories in order of appearance
  const categories = [...new Set(items.map((item) => item.category))];

  return {
    date: dateStr,
    displayDate,
    fetchedAt: new Date().toISOString(),
    availableDates,
    trending,
    categories,
    items,
  };
}
