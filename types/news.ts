/**
 * Data Contract & TypeScript Types for Berita-in
 * These interfaces define the shape of all news data flowing through the app.
 */

/** A trending / ongoing event extracted from Wikipedia's Ongoing Events portal */
export interface TrendingItem {
  id: string;
  title: string;
  category?: string;
  url: string;
}

/** An external news source linked from a Wikipedia current events entry */
export interface NewsSource {
  name: string;
  url: string;
}

/** A single parsed news item from Wikipedia's daily current events page */
export interface NewsItem {
  id: string;
  category: string;
  topic?: string;
  summary: string;
  sources: NewsSource[];
}

/** An entry in the available 7-day archive dropdown */
export interface AvailableDateEntry {
  date: string;  // ISO YYYY-MM-DD
  label: string; // e.g. "Today", "Yesterday", "Thu, Nov 20"
}

/** The full structured response returned by GET /api/news */
export interface DailyNewsResponse {
  /** ISO date string YYYY-MM-DD of the requested day */
  date: string;
  /** Human-readable date label, e.g. "Friday, November 21, 2026" */
  displayDate: string;
  /** ISO timestamp of when the data was fetched */
  fetchedAt: string;
  /** Available dates for the 7-day archive */
  availableDates: AvailableDateEntry[];
  /** Trending / ongoing events */
  trending: TrendingItem[];
  /** Distinct category names present in items */
  categories: string[];
  /** All parsed news items for the day */
  items: NewsItem[];
}

/** MediaWiki API error codes we handle explicitly */
export type MediaWikiErrorCode = "missingtitle" | "invalidtitle" | string;

/** Shape of a MediaWiki API error response */
export interface MediaWikiError {
  code: MediaWikiErrorCode;
  info: string;
  "*": string;
}
