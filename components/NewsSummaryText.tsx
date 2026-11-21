interface NewsSummaryTextProps {
  text: string;
  className?: string;
}

/**
 * Dedicated NewsSummaryText component.
 * In Milestone 3: Renders clean, readable English news summary (15px-16px, leading-relaxed).
 * In Milestone 4: Will be enhanced with word-level click-to-translate tokens.
 */
export function NewsSummaryText({ text, className = "" }: NewsSummaryTextProps) {
  return (
    <p
      className={`text-[15px] sm:text-[16px] leading-[1.7] text-[var(--color-text-primary)] ${className}`}
    >
      {text}
    </p>
  );
}
