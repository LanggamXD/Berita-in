import type { TrendingItem } from "@/types/news";

interface TrendingSectionProps {
  items: TrendingItem[];
}

export function TrendingSection({ items }: TrendingSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <span
          className="relative flex h-2.5 w-2.5 items-center justify-center"
          aria-hidden="true"
        >
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
        </span>
        <h2
          className="text-lg sm:text-xl font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Trending / Ongoing Events
        </h2>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-mono font-medium"
          style={{
            backgroundColor: "var(--color-accent-subtle)",
            color: "var(--color-accent)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* Mobile: Horizontal Swipeable Row | Desktop: 3-Column Grid */}
      <div className="flex overflow-x-auto snap-x no-scrollbar gap-3.5 pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-[260px] sm:min-w-0 snap-start rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            style={{
              backgroundColor: "var(--color-card-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              {item.category && (
                <span
                  className="mb-1.5 block text-xs font-medium tracking-wide"
                  style={{ color: "var(--color-accent)" }}
                >
                  {item.category}
                </span>
              )}
              <h3
                className="text-[15px] sm:text-[16px] font-semibold leading-snug group-hover:underline transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.title}
              </h3>
            </div>

            <div
              className="mt-3.5 pt-2 border-t flex items-center justify-between text-xs font-medium"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>Wikipedia Article</span>
              <span
                className="inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                style={{ color: "var(--color-accent)" }}
                aria-hidden="true"
              >
                Read ↗
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
