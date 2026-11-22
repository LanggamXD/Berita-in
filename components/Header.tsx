"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ListFilter,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Languages,
  Menu,
  X,
} from "lucide-react";

interface HeaderProps {
  displayDate: string;
  isRefreshing: boolean;
  theme: "light" | "dark";
  showFilters: boolean;
  isFilterActive: boolean;
  isTranslateAll: boolean;
  isTranslateAllLoading: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  onToggleTranslateAll: () => void;
  onLogout: () => void;
  logoutLoading?: boolean;
}

export function Header({
  displayDate,
  isRefreshing,
  theme,
  showFilters,
  isFilterActive,
  isTranslateAll,
  isTranslateAllLoading,
  onToggleFilters,
  onRefresh,
  onToggleTheme,
  onToggleTranslateAll,
  onLogout,
  logoutLoading = false,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling while mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key or clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const hasActiveIndicator = isTranslateAll || isFilterActive;

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--color-card-surface) 92%, transparent)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 md:px-8">
        {/* Left: Logo, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial pr-2">
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
              className="text-[20px] font-bold tracking-tight select-none leading-none truncate"
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

        {/* 1. Desktop View (hidden md:flex): Inline circular utility buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
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

          {/* 3. Translate All (EN / ID) Button */}
          <button
            type="button"
            onClick={onToggleTranslateAll}
            disabled={isTranslateAllLoading}
            title={
              isTranslateAll
                ? "Kembali ke Bahasa Inggris (EN)"
                : "Terjemahkan Semua (EN / ID)"
            }
            aria-label="Terjemahkan Semua (EN / ID)"
            className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-50 select-none cursor-pointer ${
              isTranslateAll
                ? "bg-[#0F766E] text-white border-[#0F766E] dark:bg-[#2DD4BF] dark:text-[#0F1419] dark:border-[#2DD4BF] shadow-xs"
                : ""
            }`}
            style={
              !isTranslateAll
                ? {
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-card-surface)",
                  }
                : undefined
            }
          >
            {isTranslateAllLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
          </button>

          {/* 4. Theme Toggle Button */}
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

          {/* 5. Vertical Divider */}
          <div
            className="h-4 w-px mx-1 select-none"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {/* 6. Lock / Logout Button */}
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

        {/* 2. Mobile View (flex md:hidden): Minimalist Hamburger Button & Floating Dropdown */}
        <div className="relative flex md:hidden items-center shrink-0">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu navigasi"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:opacity-80 active:scale-95 select-none cursor-pointer"
            style={{
              borderColor: isMobileMenuOpen
                ? "var(--color-accent)"
                : "var(--color-border)",
              backgroundColor: isMobileMenuOpen
                ? "var(--color-accent-subtle)"
                : "var(--color-card-surface)",
              color: isMobileMenuOpen
                ? "var(--color-accent)"
                : "var(--color-text-primary)",
            }}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}

            {/* Subtle teal indicator dot on the top-right corner if Translate All or Filter is active */}
            {hasActiveIndicator && (
              <span
                className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#171F26]"
                style={{ backgroundColor: "var(--color-accent)" }}
                aria-label="Filter atau terjemahan aktif"
              />
            )}
          </button>
        </div>
      </div>

      {/* Portal mobile dropdown and backdrop to document.body so they escape the sticky header's backdrop-filter stacking context */}
      {mounted &&
        isMobileMenuOpen &&
        createPortal(
          <div className="md:hidden">
            {/* Full-screen backdrop overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              aria-hidden="true"
            />

            {/* Floating Dropdown Menu positioned fixed below the 64px header */}
            <div
              ref={menuRef}
              className="fixed top-[72px] right-4 z-50 w-64 rounded-xl border p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 select-none"
              style={{
                backgroundColor: "var(--color-card-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              {/* 1. Filter & Tanggal */}
              <button
                type="button"
                onClick={() => {
                  onToggleFilters();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "text-[#E8EDF2] hover:bg-[#1E293B] active:bg-[#2A3540]"
                    : "text-[#141B2B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ListFilter
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: showFilters
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    }}
                  />
                  <span className="truncate">Filter & Tanggal</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isFilterActive && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--color-accent)" }}
                      aria-label="Filter aktif"
                    />
                  )}
                  <span
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      color: showFilters
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                      backgroundColor: showFilters
                        ? "var(--color-accent-subtle)"
                        : "transparent",
                    }}
                  >
                    {showFilters ? "Buka" : "Tutup"}
                  </span>
                </div>
              </button>

              {/* 2. Terjemahkan Semua (EN / ID) */}
              <button
                type="button"
                disabled={isTranslateAllLoading}
                onClick={() => {
                  onToggleTranslateAll();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                  theme === "dark"
                    ? "text-[#E8EDF2] hover:bg-[#1E293B] active:bg-[#2A3540]"
                    : "text-[#141B2B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isTranslateAllLoading ? (
                    <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-[var(--color-accent)]" />
                  ) : (
                    <Languages
                      className="h-4 w-4 shrink-0"
                      style={{
                        color: isTranslateAll
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                      }}
                    />
                  )}
                  <span className="truncate">Terjemahkan Semua</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 shrink-0 ml-2 ${
                    isTranslateAll
                      ? "bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#0F1419]"
                      : theme === "dark"
                      ? "bg-[#2A3540] text-[#E8EDF2]"
                      : "bg-[#E9EDFF] text-[#141B2B]"
                  }`}
                >
                  {isTranslateAllLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : isTranslateAll ? (
                    "ID"
                  ) : (
                    "EN"
                  )}
                </span>
              </button>

              {/* 3. Muat Ulang Berita */}
              <button
                type="button"
                disabled={isRefreshing}
                onClick={() => {
                  onRefresh();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                  theme === "dark"
                    ? "text-[#E8EDF2] hover:bg-[#1E293B] active:bg-[#2A3540]"
                    : "text-[#141B2B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RefreshCw
                    className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`}
                    style={{
                      color: isRefreshing
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    }}
                  />
                  <span className="truncate">Muat Ulang Berita</span>
                </div>
                {isRefreshing && (
                  <span
                    className="text-xs font-mono shrink-0 ml-2"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Memuat…
                  </span>
                )}
              </button>

              {/* 4. Mode Gelap / Mode Terang */}
              <button
                type="button"
                onClick={() => {
                  onToggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "text-[#E8EDF2] hover:bg-[#1E293B] active:bg-[#2A3540]"
                    : "text-[#141B2B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0 text-indigo-500" />
                  )}
                  <span className="truncate">
                    {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded capitalize shrink-0 ml-2 ${
                    theme === "dark"
                      ? "bg-[#2A3540] text-[#E8EDF2]"
                      : "bg-[#E9EDFF] text-[#141B2B]"
                  }`}
                >
                  {theme === "dark" ? "Gelap" : "Terang"}
                </span>
              </button>

              {/* 5. Subtle horizontal divider */}
              <div
                className="my-1 border-t"
                style={{ borderColor: "var(--color-border)" }}
              />

              {/* 6. Kunci / Keluar */}
              <button
                type="button"
                disabled={logoutLoading}
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="truncate">Kunci / Keluar</span>
                </div>
                {logoutLoading && (
                  <span className="text-xs font-mono shrink-0 ml-2">
                    Keluar…
                  </span>
                )}
              </button>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}