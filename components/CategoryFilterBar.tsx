interface CategoryFilterBarProps {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onSelectAll: () => void;
}

export function CategoryFilterBar({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
}: CategoryFilterBarProps) {
  if (!categories || categories.length === 0) return null;

  const isAllSelected = selectedCategories.length === 0;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {/* "All" Chip */}
      <button
        type="button"
        onClick={onSelectAll}
        className={`h-8 px-3 rounded-full text-xs font-medium shrink-0 transition-all select-none border flex items-center gap-1.5 cursor-pointer ${
          isAllSelected
            ? "font-semibold shadow-xs"
            : "hover:border-teal-500/50"
        }`}
        style={{
          backgroundColor: isAllSelected
            ? "var(--color-accent-subtle)"
            : "var(--color-card-surface)",
          color: isAllSelected
            ? "var(--color-accent)"
            : "var(--color-text-secondary)",
          borderColor: isAllSelected
            ? "var(--color-accent)"
            : "var(--color-border)",
        }}
      >
        <span>All</span>
        <span
          className="text-[10px] opacity-80 font-mono"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        >
          {categories.length}
        </span>
      </button>

      {/* Dynamic Category Chips */}
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category);

        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggleCategory(category)}
            className={`h-8 px-3 rounded-full text-xs font-medium shrink-0 transition-all select-none border flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? "font-semibold shadow-xs"
                : "hover:border-teal-500/50"
            }`}
            style={{
              backgroundColor: isSelected
                ? "var(--color-accent-subtle)"
                : "var(--color-card-surface)",
              color: isSelected
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
              borderColor: isSelected
                ? "var(--color-accent)"
                : "var(--color-border)",
            }}
          >
            <span>{category}</span>
          </button>
        );
      })}
    </div>
  );
}
