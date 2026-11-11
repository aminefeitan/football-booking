"use client";

import { useEffect, useRef } from "react";

interface MarqueeProps {
  items: string[];
  speed?: number;
  separator?: string;
  className?: string;
}

export function Marquee({ items, speed = 40, separator = " • ", className }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const text = items.join(separator) + separator;

  return (
    <div
      className={`overflow-hidden whitespace-nowrap border-y-2 border-encre bg-vert-projecteur py-3 ${className ?? ""}`}
      aria-label="Annonces"
      aria-live="polite"
    >
      <div
        className="inline-block animate-marquee font-mono text-sm font-bold text-encre uppercase tracking-widest"
        style={{ animationDuration: `${Math.max(10, text.length / speed)}s` }}
      >
        {text}{text}
      </div>
    </div>
  );
}

