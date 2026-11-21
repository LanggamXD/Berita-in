"use client";

interface HeaderProps {
  displayDate: string;
  isRefreshing: boolean;
  theme: "light" | "dark";
  onRefresh: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  logoutLoading?: boolean;
}

export function Header({
  displayDate,
  isRefreshing,
  theme,
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
          "color-mix(in srgb, var(--color-card-surface) 90%, transparent)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-6">
        {/* Left: Logo, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm select-none shrink-0 shadow-xs"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            B
          </div>
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
            <h1
              className="text-base sm:text-lg font-bold tracking-tight select-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              Berita<span style={{ color: "var(--color-accent)" }}>-in</span>
            </h1>
            {displayDate && (
              <span
                className="text-xs truncate font-mono"
                style={{
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                Wikipedia Current Events · {displayDate}
              </span>
            )}
          </div>
        </div>

        {/* Right: Compact Utility Controls (min 36px–40px tap targets) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh news"
            className="h-10 w-10 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center gap-1.5 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 select-none"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            <RefreshIcon spinning={isRefreshing} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="h-10 w-10 rounded-lg border flex items-center justify-center transition-all hover:opacity-80 select-none"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Lock / Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            title="Lock session & Logout"
            className="h-10 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-sm font-medium transition-all hover:text-red-500 hover:border-red-400 disabled:opacity-50 select-none"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-card-surface)",
            }}
          >
            <LockIcon />
            <span className="hidden sm:inline">
              {logoutLoading ? "Locking…" : "Lock"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 ${spinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.732a.75.75 0 001.5 0v-2.072l.462.462a7 7 0 0011.712-3.147.75.75 0 00-1.612-.43zM4.688 8.576a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.73a.75.75 0 00.75-.75V3.439a.75.75 0 00-1.5 0v2.072l-.462-.462a7 7 0 00-11.712 3.147.75.75 0 001.612.43z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM4.343 4.343a.75.75 0 011.061 0l1.06 1.061a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.061zM13.536 13.536a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.061-1.06a.75.75 0 010-1.061zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zM15 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0115 10zM4.343 15.657a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zM13.536 6.464a.75.75 0 010-1.06l1.061-1.061a.75.75 0 111.06 1.06l-1.06 1.061a.75.75 0 01-1.061 0zM10 6a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}
