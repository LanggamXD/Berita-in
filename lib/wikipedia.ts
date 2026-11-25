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
      const rawWeekday = d.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      const weekday = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
      const day = d.getUTCDate();
      label = `${weekday}, ${day}`;
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

// ─── Trending / Topics in the News Parser ─────────────────────────────────────

/**
 * Fetches and parses Wikipedia's "Topics in the news" (In The News / ITN).
 * Looks for Portal:Current_events/Topics_in_the_news, the .p-current-events-headlines
 * box on Portal:Current_events, or Template:In_the_news.
 */
export async function fetchTrending(noCache = false): Promise<TrendingItem[]> {
  try {
    // 1. Try dedicated subpage first
    let html = await fetchWikipediaHtml(
      "Portal:Current_events/Topics_in_the_news",
      noCache
    );

    // 2. If missing, fetch Portal:Current_events (contains .p-current-events-headlines)
    if (!html) {
      html = await fetchWikipediaHtml("Portal:Current_events", noCache);
    }

    if (!html) {
      html = await fetchWikipediaHtml("Template:In_the_news", noCache);
    }

    if (!html) return [];
    let items = parseTrending(html);

    // If main portal page didn't produce items, fallback directly to Template:In_the_news
    if (items.length === 0) {
      const itnHtml = await fetchWikipediaHtml("Template:In_the_news", noCache);
      if (itnHtml) {
        items = parseTrending(itnHtml);
      }
    }

    return items;
  } catch (err) {
    console.warn("[berita-in] Failed to fetch trending topics in the news:", err);
    return [];
  }
}

/**
 * Parses Wikipedia HTML for "Topics in the news" headline bullets.
 * Strictly extracts the top headline bullets from the primary <ul> and ignores
 * the lower "Ongoing" conflicts or "Recent deaths" sub-lists.
 */
function parseTrending(html: string): TrendingItem[] {
  const $ = cheerio.load(html);
  const items: TrendingItem[] = [];

  // Look for the "Topics in the news" headlines box
  let headlineUl = $(".p-current-events-headlines").find("ul").first();

  if (headlineUl.length === 0) {
    const heading = $("#Topics_in_the_news, :header:contains('Topics in the news')").first();
    if (heading.length > 0) {
      headlineUl = heading.closest("div, section").find("ul").first();
    }
  }

  // Fallback: the first <ul> on the page (Template:In_the_news case)
  if (headlineUl.length === 0) {
    headlineUl = $("ul").first();
  }

  if (headlineUl.length === 0) return [];

  // Strictly extract the main headline bullets (direct children <li> of the first <ul>)
  headlineUl.children("li").each((i, li) => {
    const $li = $(li);

    // Find primary link: bolded <b><a href="..."> first, or first valid <a>
    const boldLink = $li.find("b a[href], strong a[href]").first();
    const firstLink = $li.find("a[href]").first();
    const link = boldLink.length > 0 ? boldLink : firstLink;
    const href = link.attr("href") || "";
    const safeUrl = sanitizeUrl(href) ?? `${WIKIPEDIA_ORIGIN}/wiki/Portal:Current_events`;

    // Strip image annotations like "(pictured)", "(rendering shown)", [1] citations
    const clone = $li.clone();
    clone.children("ul, ol").remove();
    let rawTitle = clone.text();
    rawTitle = rawTitle
      .replace(/\s*\((?:pictured|shown|rendering shown|audio shown|video shown)[^)]*\)/gi, "")
      .replace(/\s*\[[^\]]*\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const title = stripHtml(rawTitle);

    if (title && title.length > 10) {
      items.push({
        id: `trending-${i}`,
        title,
        category: "IN THE NEWS",
        url: safeUrl,
      });
    }
  });

  return items.slice(0, 12); // cap at reasonable limit
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
    } else if ($el.is("ul, ol")) {
      // 2. Process all leaf list items under this category
      $el.find("li").each((_j, li) => {
        const $li = $(li);

        // Skip parent <li> that contains nested lists — we want the leaf items with news
        if ($li.children("ul, ol").length > 0) {
          return;
        }

        // When a leaf <li> is nested under a parent topic <li>, extract parent topic
        const parentLi = $li.parents("li").first();
        let topic: string | undefined;
        if (parentLi.length > 0) {
          const cloneParent = parentLi.clone();
          cloneParent.children("ul, ol").remove();
          const parentText = stripHtml(cloneParent.text());
          if (parentText && parentText.length < 150) {
            topic = parentText;
          }
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

        // Extract summary: clean leaf li text without nested lists
        const clone = $li.clone();
        clone.children("ul, ol").remove();
        let rawSummary = clone.text().trim();

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
            topic,
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
          if ($li.children("ul, ol").length > 0) return;

          const parentLi = $li.parents("li").first();
          let topic: string | undefined;
          if (parentLi.length > 0) {
            const cloneParent = parentLi.clone();
            cloneParent.children("ul, ol").remove();
            const parentText = stripHtml(cloneParent.text());
            if (parentText && parentText.length < 150) {
              topic = parentText;
            }
          }

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

          const clone = $li.clone();
          clone.children("ul, ol").remove();
          let raw = clone.text().trim();
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
              topic,
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
