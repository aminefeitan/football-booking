"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@phosphor-icons/react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: any;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "green" | "orange" | "yellow" | "default";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  trend,
  accentColor = "default",
  className,
}: StatCardProps) {
  const accentClasses = {
    green: "text-vert-projecteur bg-vert-projecteur/10 border-vert-projecteur/20",
    orange: "text-orange-sifflet bg-orange-sifflet/10 border-orange-sifflet/20",
    yellow: "text-jaune-carton bg-jaune-carton/10 border-jaune-carton/20",
    default: "text-craie/80 bg-craie/5 border-craie/10",
  }[accentColor];

  const valueGradients = {
    green: "text-vert-projecteur",
    orange: "text-orange-sifflet",
    yellow: "text-jaune-carton",
    default: "text-craie",
  }[accentColor];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-encre/70 backdrop-blur-xl border border-craie/10 p-5 shadow-lg shadow-black/20 hover:border-craie/20 hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wider text-craie/60">
            {title}
          </p>
          <div className={cn("font-display font-black text-3xl sm:text-4xl tracking-tight leading-none mt-1", valueGradients)}>
            {value}
          </div>
        </div>

        {IconComponent && (
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border shrink-0", accentClasses)}>
            <IconComponent size={22} weight="bold" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-craie/5 text-xs font-mono">
          {trend && (
            <span
              className={cn(
                "font-bold px-1.5 py-0.5 rounded text-[11px]",
                trend.isPositive ? "bg-vert-projecteur/15 text-vert-projecteur" : "bg-orange-sifflet/15 text-orange-sifflet"
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-craie/50">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
