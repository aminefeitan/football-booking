import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "libre"
  | "reserve"
  | "last"
  | "default"
  | "confirmed"
  | "pending"
  | "cancelled"
  | "expired"
  | "completed";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
  libre: {
    bg: "bg-vert-projecteur/10",
    text: "text-vert-projecteur",
    border: "border-vert-projecteur/30",
    dotColor: "bg-vert-projecteur",
  },
  reserve: {
    bg: "bg-craie/5",
    text: "text-craie/50",
    border: "border-craie/15",
    dotColor: "bg-craie/40",
  },
  last: {
    bg: "bg-orange-sifflet/10",
    text: "text-orange-sifflet",
    border: "border-orange-sifflet/30",
    dotColor: "bg-orange-sifflet",
  },
  default: {
    bg: "bg-encre/70",
    text: "text-craie/80",
    border: "border-craie/15",
    dotColor: "bg-craie/60",
  },
  confirmed: {
    bg: "bg-vert-projecteur/15",
    text: "text-vert-projecteur",
    border: "border-vert-projecteur/30",
    dotColor: "bg-vert-projecteur",
  },
  pending: {
    bg: "bg-jaune-carton/15",
    text: "text-jaune-carton",
    border: "border-jaune-carton/30",
    dotColor: "bg-jaune-carton",
  },
  cancelled: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    dotColor: "bg-red-400",
  },
  expired: {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/30",
    dotColor: "bg-gray-400",
  },
  completed: {
    bg: "bg-vert-projecteur/10",
    text: "text-vert-projecteur",
    border: "border-vert-projecteur/20",
    dotColor: "bg-vert-projecteur",
  },
};

export function Badge({ variant = "default", dot = true, className, children, ...props }: BadgeProps) {
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-full border backdrop-blur-sm",
        style.bg,
        style.text,
        style.border,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", style.dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

