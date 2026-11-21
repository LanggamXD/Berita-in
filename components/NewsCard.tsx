import type { NewsItem } from "@/types/news";
import { NewsSummaryText } from "./NewsSummaryText";

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const hasSources = item.sources && item.sources.length > 0;

  return (
    <article
      className="group rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between"
      style={{
        backgroundColor: "var(--color-card-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 1. Header: Category Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--color-accent-subtle)",
            color: "var(--color-accent)",
          }}
        >
          {item.category}
        </span>
      </div>

      {/* 2. Body: Summary Text */}
      <div className="flex-1 mb-4">
        <NewsSummaryText text={item.summary} />
      </div>

      {/* 3. Footer: Sources & External Links */}
      <div
        className="pt-3 border-t flex items-center justify-between gap-3 text-xs"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-medium">
            {hasSources
              ? item.sources.map((s) => s.name).join(", ")
              : "Wikipedia Current Events"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasSources ? (
            item.sources.map((source, idx) => (
              <a
                key={`${source.url}-${idx}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open source: ${source.name}`}
                className="inline-flex items-center gap-1 font-medium hover:underline transition-colors"
                style={{ color: "var(--color-accent)" }}
              >
                <span>{item.sources.length === 1 ? "Source" : `Source ${idx + 1}`}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))
          ) : (
            <span
              className="inline-flex items-center gap-1 opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Wikipedia
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
