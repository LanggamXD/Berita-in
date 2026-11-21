"use client";

import { useId, useMemo, type MouseEvent } from "react";
import { useTranslation } from "./TranslationProvider";

interface NewsSummaryTextProps {
  text: string;
  className?: string;
}

interface TextToken {
  text: string;
  isWord: boolean;
  cleanWord?: string;
}

/**
 * Splits news paragraph text into clean word tokens vs whitespace/punctuation tokens.
 * Keeps punctuation and numbers intact without layout shifts, while making English words
 * clickable for instant inline translation.
 */
function tokenizeText(text: string): TextToken[] {
  if (!text) return [];

  // Match English words with optional internal hyphens or apostrophes
  const wordRegex = /([a-zA-Z]+(?:['’–-][a-zA-Z]+)*)/g;
  const tokens: TextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const matchIndex = match.index;

    // Preceding non-word segment (punctuation, whitespace, numbers)
    if (matchIndex > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, matchIndex),
        isWord: false,
      });
    }

    const rawWord = match[0];
    // Clean trailing apostrophe-s and edge punctuation
    const cleanWord = rawWord
      .toLowerCase()
      .replace(/['’]s$/i, "")
      .replace(/^['’–-]+|['’–-]+$/g, "");

    // Translatable condition: at least 2 letters, clean English word
    const isTranslatable =
      cleanWord.length >= 2 && /^[a-z'-]+$/.test(cleanWord);

    if (isTranslatable) {
      tokens.push({
        text: rawWord,
        isWord: true,
        cleanWord,
      });
    } else {
      tokens.push({
        text: rawWord,
        isWord: false,
      });
    }

    lastIndex = matchIndex + rawWord.length;
  }

  // Trailing punctuation / whitespace
  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      isWord: false,
    });
  }

  return tokens;
}

/**
 * Interactive NewsSummaryText component for Milestone 4.
 * Every English word is individually clickable for on-demand EN -> ID translation,
 * while maintaining a clean, distraction-free reading experience by default.
 */
export function NewsSummaryText({ text, className = "" }: NewsSummaryTextProps) {
  const instanceId = useId();
  const { activeWordId, translateWord } = useTranslation();

  const tokens = useMemo(() => tokenizeText(text), [text]);

  const handleWordClick = (
    e: MouseEvent<HTMLSpanElement>,
    tokenId: string,
    cleanWord: string
  ) => {
    e.stopPropagation();
    translateWord(tokenId, cleanWord, e.currentTarget);
  };

  return (
    <p
      className={`text-[14px] md:text-[15px] leading-relaxed text-[var(--color-text-primary)] ${className}`}
    >
      {tokens.map((token, index) => {
        if (!token.isWord || !token.cleanWord) {
          return <span key={index}>{token.text}</span>;
        }

        const tokenId = `${instanceId}-w${index}`;
        const isActive = activeWordId === tokenId;

        return (
          <span
            key={index}
            role="button"
            tabIndex={0}
            onClick={(e) => handleWordClick(e, tokenId, token.cleanWord!)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                translateWord(tokenId, token.cleanWord!, e.currentTarget);
              }
            }}
            className={`rounded px-0.5 cursor-pointer transition-colors ${
              isActive
                ? "bg-[rgba(15,118,110,0.16)] text-[#0F766E] dark:bg-[rgba(45,212,191,0.22)] dark:text-[#2DD4BF]"
                : "hover:bg-[rgba(15,118,110,0.12)] dark:hover:bg-[rgba(45,212,191,0.18)]"
            }`}
            title="Click to translate"
          >
            {token.text}
          </span>
        );
      })}
    </p>
  );
}
