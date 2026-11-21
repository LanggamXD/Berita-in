import { ArrowUpRight } from "lucide-react";
import type { NewsItem } from "@/types/news";
import { NewsSummaryText } from "./NewsSummaryText";

interface NewsCardProps {
  item: NewsItem;
  date?: string;
}

export function NewsCard({ item, date }: NewsCardProps) {
  const hasSources = item.sources && item.sources.length > 0;
  const primaryUrl = hasSources
    ? item.sources[0].url
    : "https://en.wikipedia.org/wiki/Portal:Current_events";

  return (
    <article
      className="group rounded-xl p-5 border border-[#BDC9C6]/60 dark:border-[#2A3540] bg-white dark:bg-[#171F26] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
      style={{
        backgroundColor: "var(--color-card-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 1. Top bar inside card: Category badge on left + subtle mono date/tag on right */}
      <div>
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-accent-subtle)",
              color: "var(--color-accent)",
            }}
          >
            {item.category}
          </span>

          <span
            className="text-[10px] font-mono tracking-wider opacity-60 uppercase select-none"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {date || "DISPATCH"}
          </span>
        </div>

        {/* 2. Card body: Bold topic/headline if present + News summary */}
        {item.topic && (
          <h3
            className="text-[16px] font-bold leading-snug mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {item.topic}
          </h3>
        )}

        <div className="mb-4">
          <NewsSummaryText text={item.summary} />
        </div>
      </div>

      {/* 3. Card footer: Subtle top border, source name(s) on left and 'Read full ↗' on right */}
      <div
        className="pt-3 mt-3 border-t border-[#BDC9C6]/60 dark:border-[#2A3540] flex items-center justify-between gap-3 text-xs"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-medium truncate text-xs">
            {hasSources
              ? item.sources.map((s) => s.name).join(", ")
              : "Wikipedia Current Events"}
          </span>
        </div>

        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={hasSources ? `Read full: ${item.sources[0].name}` : "Read on Wikipedia"}
          className="inline-flex items-center gap-1 font-semibold hover:underline transition-colors shrink-0 select-none text-xs"
          style={{ color: "var(--color-accent)" }}
        >
          <span>Read full</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
