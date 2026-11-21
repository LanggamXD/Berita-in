"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ActiveWordInfo {
  id: string; // unique token id within the page
  word: string; // clean lowercase word
  element: HTMLElement;
}

interface TranslationState {
  status: "idle" | "loading" | "success" | "error";
  translation?: string;
}

interface TranslationContextType {
  activeWordId: string | null;
  translateWord: (id: string, cleanWord: string, element: HTMLElement) => void;
  closeTranslation: () => void;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const STORAGE_KEY = "beritain_translations";

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [activeWord, setActiveWord] = useState<ActiveWordInfo | null>(null);
  const [translationState, setTranslationState] = useState<TranslationState>({
    status: "idle",
  });
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);

  const clientCacheRef = useRef<Map<string, string>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const initialScrollYRef = useRef<number>(0);

  // Initialize client cache from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        clientCacheRef.current = new Map(Object.entries(parsed));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Save client cache to localStorage (keep latest 300 entries)
  const saveCache = useCallback(() => {
    try {
      const entries = Array.from(clientCacheRef.current.entries()).slice(-300);
      const obj = Object.fromEntries(entries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore storage errors
    }
  }, []);

  const closeTranslation = useCallback(() => {
    setActiveWord(null);
    setTranslationState({ status: "idle" });
    setPosition(null);
    activeElementRef.current = null;
  }, []);

  // Update tooltip coordinates based on active word element and tooltip dimensions
  const updatePosition = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const tooltipWidth = tooltip?.offsetWidth || 120;
    const tooltipHeight = tooltip?.offsetHeight || 32;

    const targetCenterX = rect.left + rect.width / 2;
    const rawLeft = targetCenterX - tooltipWidth / 2;

    // Viewport horizontal clamping (12px margin from screen edges)
    const minLeft = 12;
    const maxLeft = Math.max(minLeft, window.innerWidth - tooltipWidth - 12);
    const left = Math.max(minLeft, Math.min(maxLeft, rawLeft));

    // Vertical placement: default above, flip below if too close to header / top
    const HEADER_BUFFER = 72; // 64px header + 8px margin
    const spaceAbove = rect.top;

    let top: number;
    let placement: "top" | "bottom";

    if (spaceAbove - tooltipHeight - 6 < HEADER_BUFFER) {
      // Flip below
      placement = "bottom";
      top = rect.bottom + 6;
    } else {
      // Place above
      placement = "top";
      top = rect.top - tooltipHeight - 6;
    }

    setPosition({ top, left, placement });
  }, []);

  const translateWord = useCallback(
    async (id: string, cleanWord: string, element: HTMLElement) => {
      // If clicking the currently active word, toggle it off
      if (activeWord?.id === id) {
        closeTranslation();
        return;
      }

      activeElementRef.current = element;
      initialScrollYRef.current = window.scrollY;
      setActiveWord({ id, word: cleanWord, element });

      // Immediate positioning calculation
      updatePosition(element);

      // 1. Check client-side in-memory cache
      const cached = clientCacheRef.current.get(cleanWord);
      if (cached) {
        setTranslationState({ status: "success", translation: cached });
        return;
      }

      // 2. Fetch from server endpoint
      setTranslationState({ status: "loading" });

      try {
        const res = await fetch(`/api/translate?word=${encodeURIComponent(cleanWord)}`);
        if (!res.ok) {
          setTranslationState({ status: "error" });
          return;
        }

        const data = await res.json();
        if (data.translation) {
          clientCacheRef.current.set(cleanWord, data.translation);
          saveCache();
          setTranslationState({
            status: "success",
            translation: data.translation,
          });
        } else {
          setTranslationState({ status: "error" });
        }
      } catch {
        setTranslationState({ status: "error" });
      }
    },
    [activeWord?.id, closeTranslation, saveCache, updatePosition]
  );

  // Recalculate position whenever translation content renders/changes size
  useEffect(() => {
    if (activeElementRef.current) {
      updatePosition(activeElementRef.current);
    }
  }, [translationState, updatePosition]);

  // Auto-dismiss event listeners (Escape, Click Outside, Scroll > 20px, Resize)
  useEffect(() => {
    if (!activeWord) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeTranslation();
      }
    }

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Do nothing if click is inside tooltip or inside the active word element
      if (tooltipRef.current?.contains(target)) return;
      if (activeElementRef.current?.contains(target)) return;

      closeTranslation();
    }

    function handleScroll() {
      if (Math.abs(window.scrollY - initialScrollYRef.current) > 20) {
        closeTranslation();
      }
    }

    function handleResize() {
      if (activeElementRef.current) {
        updatePosition(activeElementRef.current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeWord, closeTranslation, updatePosition]);

  return (
    <TranslationContext.Provider
      value={{
        activeWordId: activeWord?.id || null,
        translateWord,
        closeTranslation,
      }}
    >
      {children}

      {/* Floating Translation Tooltip Portal */}
      {mounted &&
        activeWord &&
        position &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-live="polite"
            className="fixed z-50 rounded-lg px-3 py-1.5 text-[13px] font-medium shadow-lg pointer-events-auto select-none transition-all duration-150 bg-[#1E293B] text-[#F8FAFC] dark:bg-[#F1F5F9] dark:text-[#0F172A]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {translationState.status === "loading" && (
              <span className="inline-block font-mono tracking-widest animate-pulse opacity-80">
                ···
              </span>
            )}
            {translationState.status === "error" && (
              <span className="text-red-300 dark:text-red-600 text-xs font-normal">
                Gagal menerjemahkan
              </span>
            )}
            {translationState.status === "success" && (
              <span className="font-semibold tracking-normal">
                {translationState.translation}
              </span>
            )}
          </div>,
          document.body
        )}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
