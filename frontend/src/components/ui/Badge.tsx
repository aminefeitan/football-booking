import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "libre" | "reserve" | "last" | "default" | "confirmed" | "pending" | "cancelled" | "expired" | "completed";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  libre: "bg-vert-projecteur text-encre border-encre",
  reserve: "bg-encre text-craie border-craie/30",
  last: "bg-orange-sifflet text-craie border-encre",
  default: "bg-craie text-encre border-encre",
  confirmed: "bg-vert-projecteur text-encre border-encre",
  pending: "bg-jaune-carton text-encre border-encre",
  cancelled: "bg-red-600 text-white border-encre",
  expired: "bg-gray-500 text-white border-encre",
  completed: "bg-nuit-pelouse text-vert-projecteur border-vert-projecteur",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-widest border-2 font-mono",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

