"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { TrendingItem } from "@/types/news";

interface TrendingSectionProps {
  items: TrendingItem[];
}

export function TrendingSection({ items }: TrendingSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const CARDS_PER_PAGE = 3;
  const maxIndex = Math.max(0, items.length - CARDS_PER_PAGE);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxIndex;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleItems = items.slice(currentIndex, currentIndex + CARDS_PER_PAGE);

  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title + LIVE FEED badge */}
        <div className="flex items-center gap-2.5">
          <h2
            className="text-[22px] md:text-[24px] font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Trending Intelligence
          </h2>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider border select-none"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-accent-subtle)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            LIVE FEED
          </span>
        </div>

        {/* Right: Items count + Working < > Circular Arrow Buttons */}
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-mono select-none"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {items.length} Topics in the News
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canPrev}
              title="Previous topics"
              aria-label="Previous topics"
              className="h-7 w-7 rounded-full border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              title="Next topics"
              aria-label="Next topics"
              className="h-7 w-7 rounded-full border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Strictly 3 Cards at a time in a 3-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visibleItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border"
            style={{
              backgroundColor: "var(--color-card-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              <span
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-accent)" }}
              >
                {item.category || "IN THE NEWS"}
              </span>
              <h3
                className="text-[15px] font-semibold leading-snug transition-colors group-hover:underline"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.title}
              </h3>
            </div>

            <div
              className="mt-4 pt-2.5 border-t flex items-center justify-between text-xs"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span className="font-mono text-[11px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                Wikipedia · Topic
              </span>
              <span
                className="inline-flex items-center transition-transform group-hover:translate-x-0.5"
                style={{ color: "var(--color-accent)" }}
                aria-hidden="true"
              >
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
