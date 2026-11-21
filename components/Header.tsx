"use client";

import { ListFilter, RefreshCw, Sun, Moon, LogOut } from "lucide-react";

interface HeaderProps {
  displayDate: string;
  isRefreshing: boolean;
  theme: "light" | "dark";
  showFilters: boolean;
  isFilterActive: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  logoutLoading?: boolean;
}

export function Header({
  displayDate,
  isRefreshing,
  theme,
  showFilters,
  isFilterActive,
  onToggleFilters,
  onRefresh,
  onToggleTheme,
  onLogout,
  logoutLoading = false,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 h-16 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--color-card-surface) 92%, transparent)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 md:px-8">
        {/* Left: Logo, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-base font-mono select-none shrink-0 shadow-xs"
            style={{
              backgroundColor: "var(--color-accent)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            B
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h1
              className="text-[20px] font-bold tracking-tight select-none leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              Berita<span style={{ color: "var(--color-accent)" }}>-in</span>
            </h1>
            {displayDate ? (
              <p
                className="text-xs truncate font-mono mt-0.5"
                style={{
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                Powered by Wikipedia Current Events · {displayDate}
              </p>
            ) : (
              <p
                className="text-xs truncate font-mono mt-0.5"
                style={{
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                Powered by Wikipedia Current Events
              </p>
            )}
          </div>
        </div>

        {/* Right: Circular w-9 h-9 rounded-full utility buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Filter Button */}
          <button
            type="button"
            onClick={onToggleFilters}
            title={showFilters ? "Hide filters & archive" : "Show filters & archive"}
            aria-label="Toggle filters"
            className={`relative h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:opacity-80 select-none cursor-pointer ${
              showFilters ? "shadow-xs" : ""
            }`}
            style={{
              borderColor: showFilters
                ? "var(--color-accent)"
                : "var(--color-border)",
              color: showFilters
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
              backgroundColor: showFilters
                ? "var(--color-accent-subtle)"
                : "var(--color-card-surface)",
            }}
          >
            <ListFilter className="h-4 w-4" />
            {isFilterActive && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-accent)" }}
                aria-label="Active filter indicator"
              />
            )}
          </button>

          {/* 2. Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh news"
            aria-label="Refresh news"
            className="h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-50 select-none cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              style={{ color: isRefreshing ? "var(--color-accent)" : undefined }}
            />
          </button>

          {/* 3. Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle dark/light mode"
            className="h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:opacity-80 select-none cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* 4. Vertical Divider */}
          <div
            className="h-4 w-px mx-1 select-none"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {/* 5. Lock / Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            title="Lock session & Logout"
            aria-label="Lock session"
            className="h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:text-red-500 hover:border-red-400 disabled:opacity-50 select-none cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
