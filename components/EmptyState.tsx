interface EmptyStateProps {
  isFiltered?: boolean;
  dateStr: string;
  onResetFilter?: () => void;
}

export function EmptyState({
  isFiltered = false,
  dateStr,
  onResetFilter,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-xl border p-10 text-center max-w-md mx-auto shadow-sm my-6"
      style={{
        backgroundColor: "var(--color-card-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg select-none"
        style={{
          backgroundColor: "var(--color-accent-subtle)",
          color: "var(--color-accent)",
        }}
      >
        {isFiltered ? "🔍" : "📰"}
      </div>

      <h3
        className="text-base sm:text-lg font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {isFiltered
          ? "No news match your filters"
          : "No news items published yet"}
      </h3>

      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {isFiltered ? (
          "You have filtered out all categories for this day. Click below to restore all categories."
        ) : (
          <>
            Wikipedia has not published news items for{" "}
            <span
              className="font-mono font-medium"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              {dateStr}
            </span>{" "}
            yet. Try selecting an earlier date from the archive strip above.
          </>
        )}
      </p>

      {isFiltered && onResetFilter && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onResetFilter}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 shadow-xs"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
