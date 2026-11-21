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

  const isAllSelected =
    selectedCategories.length === 0 ||
    selectedCategories.length === categories.length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {/* "All" Chip */}
      <button
        type="button"
        onClick={onSelectAll}
        className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-medium shrink-0 transition-all select-none border flex items-center gap-1 ${
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
        <span>All News</span>
        <span
          className="text-[11px] opacity-80 font-mono"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          {categories.length}
        </span>
      </button>

      {/* Dynamic Category Chips */}
      {categories.map((category) => {
        const isSelected =
          !isAllSelected && selectedCategories.includes(category);

        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggleCategory(category)}
            className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-medium shrink-0 transition-all select-none border flex items-center gap-1.5 ${
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
