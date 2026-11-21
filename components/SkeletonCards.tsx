/**
 * Soft pulsing skeleton cards for smooth loading transitions
 * 3 skeletons for Trending, 6 skeletons for Today's News feed
 */

export function TrendingSkeletons() {
  return (
    <div className="space-y-3.5">
      <div className="h-6 w-48 rounded-md bg-[var(--color-border)] opacity-40 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border p-4 shadow-sm animate-pulse space-y-3"
            style={{
              backgroundColor: "var(--color-card-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="h-3 w-20 rounded bg-[var(--color-border)] opacity-50" />
            <div className="h-4 w-5/6 rounded bg-[var(--color-border)] opacity-60" />
            <div className="h-3 w-1/3 rounded bg-[var(--color-border)] opacity-40 pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsFeedSkeletons() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 rounded-md bg-[var(--color-border)] opacity-40 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border p-5 shadow-sm animate-pulse space-y-4 flex flex-col justify-between min-h-[190px]"
            style={{
              backgroundColor: "var(--color-card-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="space-y-3">
              <div className="h-5 w-24 rounded-full bg-[var(--color-border)] opacity-40" />
              <div className="h-4 w-full rounded bg-[var(--color-border)] opacity-60" />
              <div className="h-4 w-11/12 rounded bg-[var(--color-border)] opacity-50" />
              <div className="h-4 w-3/4 rounded bg-[var(--color-border)] opacity-40" />
            </div>
            <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="h-3 w-20 rounded bg-[var(--color-border)] opacity-40" />
              <div className="h-3 w-14 rounded bg-[var(--color-border)] opacity-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
