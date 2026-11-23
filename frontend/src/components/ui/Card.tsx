"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "glow" | "outline";
  hoverEffect?: boolean;
}

export function Card({
  variant = "glass",
  hoverEffect = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variant === "glass" &&
          "bg-encre/70 backdrop-blur-xl border border-craie/10 shadow-xl shadow-black/20",
        variant === "solid" &&
          "bg-encre border border-craie/10 shadow-lg shadow-black/30",
        variant === "glow" &&
          "bg-gradient-to-br from-encre/90 to-nuit-pelouse/70 backdrop-blur-xl border border-vert-projecteur/20 shadow-xl shadow-vert-projecteur/5",
        variant === "outline" &&
          "bg-transparent border border-craie/15",
        hoverEffect &&
          "hover:-translate-y-1 hover:border-vert-projecteur/40 hover:shadow-2xl hover:shadow-vert-projecteur/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
