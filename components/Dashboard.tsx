"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { DailyNewsResponse, AvailableDateEntry } from "@/types/news";
import { ReadingProgressBar } from "./ReadingProgressBar";
import { Header } from "./Header";
import { ArchiveDateStrip } from "./ArchiveDateStrip";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { TrendingSection } from "./TrendingSection";
import { NewsCard } from "./NewsCard";
import { TrendingSkeletons, NewsFeedSkeletons } from "./SkeletonCards";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { TranslationProvider } from "./TranslationProvider";

const THEME_STORAGE_KEY = "beritain_theme";
const CATEGORY_STORAGE_KEY = "beritain_categories";
const FILTER_VISIBILITY_KEY = "beritain_filter_visibility";

export function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeDate, setActiveDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<AvailableDateEntry[]>([]);
  const [data, setData] = useState<DailyNewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  // ── Initialize Theme, Dates & Preferences ──────────────────────────────────
  useEffect(() => {
    // 1. Theme sync with localStorage / system preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    const initialTheme: "light" | "dark" =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Build 7-day UTC-safe dates client-side
    const dates: AvailableDateEntry[] = [];
    const now = new Date();
    const todayIso = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
      .toISOString()
      .slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
      );
      const iso = d.toISOString().slice(0, 10);
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
      dates.push({ date: iso, label });
    }

    setAvailableDates(dates);
    setActiveDate(todayIso);

    // 3. Load saved category & filter visibility preferences
    try {
      const savedCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (savedCats) {
        setSelectedCategories(JSON.parse(savedCats));
      }
      const savedVisibility = localStorage.getItem(FILTER_VISIBILITY_KEY);
      if (savedVisibility !== null) {
        setShowFilters(savedVisibility === "true");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // ── Toggle Theme ───────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ── Toggle Filters Visibility ──────────────────────────────────────────────
  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FILTER_VISIBILITY_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ── Fetch News Handler ─────────────────────────────────────────────────────
  const fetchNews = useCallback(
    async (date: string, isRefresh = false) => {
      if (!date) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({ date });
        if (isRefresh) params.set("refresh", "1");

        const res = await fetch(`/api/news?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json?.message || `Error: HTTP ${res.status}`);
        } else {
          setData(json as DailyNewsResponse);
          if (json.availableDates && json.availableDates.length > 0) {
            setAvailableDates(json.availableDates);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ── Initial & Date-change Fetch Trigger ────────────────────────────────────
  useEffect(() => {
    if (activeDate) {
      fetchNews(activeDate, false);
    }
  }, [activeDate, fetchNews]);

  // ── Category Filter Handlers ───────────────────────────────────────────────
  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      let next: string[];
      if (prev.includes(category)) {
        next = prev.filter((c) => c !== category);
      } else {
        next = [...prev, category];
      }
      try {
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories([]);
    try {
      localStorage.removeItem(CATEGORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // ── Filtered Items Computation ─────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!data || !data.items) return [];
    if (selectedCategories.length === 0) return data.items;
    return data.items.filter((item) =>
      selectedCategories.includes(item.category)
    );
  }, [data, selectedCategories]);

  // ── Logout Handler ─────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/login");
    } catch {
      window.location.assign("/login");
    } finally {
      setLogoutLoading(false);
    }
  }, []);

  return (
    <TranslationProvider>
      <div
        className="flex min-h-screen flex-col transition-colors duration-200"
        style={{ backgroundColor: "var(--color-page-bg)" }}
      >
        {/* 1. 2px Reading Progress Bar */}
        <ReadingProgressBar />

        {/* 2. Sticky Header (h-16) */}
        <Header
          displayDate={data?.displayDate || ""}
          isRefreshing={refreshing}
          theme={theme}
          showFilters={showFilters}
          isFilterActive={selectedCategories.length > 0}
          onToggleFilters={handleToggleFilters}
          onRefresh={() => fetchNews(activeDate, true)}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />

        {/* 3. Collapsible 7-Day Date Strip & Category Filter Bar */}
        {showFilters && (
          <section
            className="border-b transition-all duration-200"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-card-surface) 75%, transparent)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="mx-auto max-w-6xl px-5 md:px-8 py-3 space-y-2.5">
              {/* 7-Day Archive Date Strip */}
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider shrink-0 select-none hidden sm:inline"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  Archive:
                </span>
                <ArchiveDateStrip
                  dates={availableDates}
                  activeDate={activeDate}
                  onSelectDate={(newDate) => {
                    if (newDate !== activeDate) {
                      setActiveDate(newDate);
                    }
                  }}
                  disabled={loading || refreshing}
                />
              </div>

              {/* Dynamic Category Filter Bar */}
              {data && data.categories && data.categories.length > 0 && (
                <div
                  className="flex items-center gap-2.5 pt-2 border-t overflow-hidden"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider shrink-0 select-none hidden sm:inline"
                    style={{
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    Categories:
                  </span>
                  <CategoryFilterBar
                    categories={data.categories}
                    selectedCategories={selectedCategories}
                    onToggleCategory={handleToggleCategory}
                    onSelectAll={handleSelectAllCategories}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Main Dashboard Body */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 md:px-8 py-6 md:py-8 space-y-8">
          {/* Error Banner */}
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => fetchNews(activeDate, true)}
            />
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="space-y-8 pt-2">
              <TrendingSkeletons />
              <NewsFeedSkeletons />
            </div>
          ) : (
            data && (
              <>
                {/* 5. Trending Intelligence Section (Topics in the News) */}
                {data.trending && data.trending.length > 0 && (
                  <TrendingSection items={data.trending} />
                )}

                {/* 6. Today's Briefing Section */}
                <section className="space-y-4 pt-1">
                  {/* Section Title & Metrics */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2
                      className="text-[22px] md:text-[24px] font-bold tracking-tight"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Today&apos;s Briefing
                    </h2>
                    {filteredItems.length > 0 && (
                      <span
                        className="text-xs font-mono select-none"
                        style={{
                          color: "var(--color-text-secondary)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        Showing {filteredItems.length} of {data.items.length} items
                      </span>
                    )}
                  </div>

                  {/* News Card Grid */}
                  {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredItems.map((item) => (
                        <NewsCard key={item.id} item={item} date={data.date} />
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <EmptyState
                      isFiltered={
                        data.items.length > 0 && selectedCategories.length > 0
                      }
                      dateStr={data.displayDate || activeDate}
                      onResetFilter={handleSelectAllCategories}
                    />
                  )}
                </section>
              </>
            )
          )}
        </main>

        {/* 7. Footer */}
        <footer
          className="mt-16 border-t py-6 text-center text-xs"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p>
            Berita-in · Powered by{" "}
            <a
              href="https://en.wikipedia.org/wiki/Portal:Current_events"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Wikipedia Current Events
            </a>
          </p>
        </footer>
      </div>
    </TranslationProvider>
  );
}
