interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="rounded-xl border p-5 shadow-sm my-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{
        backgroundColor: "var(--color-card-surface)",
        borderColor: "#f87171",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-red-500 font-bold text-lg leading-none mt-0.5">
          ⚠
        </span>
        <div>
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
            Gagal Memuat Berita
          </h3>
          <p
            className="text-xs sm:text-sm mt-0.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {message || "Wikipedia saat ini tidak dapat dijangkau. Silakan coba sesaat lagi."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="h-9 px-4 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0 shadow-xs"
      >
        Coba Lagi
      </button>
    </div>
  );
}
