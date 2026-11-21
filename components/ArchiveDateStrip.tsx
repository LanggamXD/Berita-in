import type { AvailableDateEntry } from "@/types/news";

interface ArchiveDateStripProps {
  dates: AvailableDateEntry[];
  activeDate: string;
  onSelectDate: (date: string) => void;
  disabled?: boolean;
}

export function ArchiveDateStrip({
  dates,
  activeDate,
  onSelectDate,
  disabled = false,
}: ArchiveDateStripProps) {
  if (!dates || dates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {dates.map((item) => {
        const isActive = item.date === activeDate;
        return (
          <button
            key={item.date}
            type="button"
            onClick={() => onSelectDate(item.date)}
            disabled={disabled}
            className={`h-10 px-4 rounded-full text-sm font-medium shrink-0 transition-all select-none flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? "shadow-sm font-semibold"
                : "border hover:border-teal-500/50"
            }`}
            style={{
              backgroundColor: isActive
                ? "var(--color-accent)"
                : "var(--color-card-surface)",
              color: isActive
                ? "var(--color-accent-text)"
                : "var(--color-text-secondary)",
              borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            <span>{item.label}</span>
            <span
              className="text-[11px] opacity-75 font-mono"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              {item.date.slice(5)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
