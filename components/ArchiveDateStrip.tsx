import type { AvailableDateEntry } from "@/types/news";

interface ArchiveDateStripProps {
  dates: AvailableDateEntry[];
  activeDate: string;
  onSelectDate: (date: string) => void;
  disabled?: boolean;
}

function formatPillLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Yesterday";

  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;

  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const rawWeekday = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const weekday = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
  const day = dateObj.getUTCDate();

  return `${weekday}, ${day}`;
}

export function ArchiveDateStrip({
  dates,
  activeDate,
  onSelectDate,
  disabled = false,
}: ArchiveDateStripProps) {
  if (!dates || dates.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {dates.map((item, index) => {
        const isActive = item.date === activeDate;
        const displayLabel = formatPillLabel(item.date, index);

        return (
          <button
            key={item.date}
            type="button"
            onClick={() => onSelectDate(item.date)}
            disabled={disabled}
            title={item.date}
            aria-label={`${displayLabel} (${item.date})`}
            className={`h-8 px-3.5 rounded-full text-xs sm:text-sm font-medium shrink-0 whitespace-nowrap transition-all select-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isActive
                ? "font-semibold shadow-xs"
                : "border hover:border-teal-500/50"
            }`}
            style={{
              backgroundColor: isActive
                ? "var(--color-accent)"
                : "var(--color-card-surface)",
              color: isActive
                ? "#FFFFFF"
                : "var(--color-text-secondary)",
              borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            <span>{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
