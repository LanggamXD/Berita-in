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
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {dates.map((item) => {
        const isActive = item.date === activeDate;
        return (
          <button
            key={item.date}
            type="button"
            onClick={() => onSelectDate(item.date)}
            disabled={disabled}
            className={`h-8 px-3.5 rounded-full text-xs sm:text-sm font-medium shrink-0 transition-all select-none flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
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
            <span>{item.label}</span>
            <span
              className="text-[10px] font-mono opacity-80"
              style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              {item.date.slice(5)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
