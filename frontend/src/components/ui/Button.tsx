"use client";

import { forwardRef, ButtonHTMLAttributes, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "booking";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-vert-projecteur text-encre font-bold shadow-md hover:shadow-lg hover:shadow-vert-projecteur/20 hover:brightness-105 active:scale-[0.98] border border-vert-projecteur",
  secondary:
    "bg-orange-sifflet text-craie font-bold shadow-md hover:shadow-lg hover:shadow-orange-sifflet/20 hover:brightness-105 active:scale-[0.98] border border-orange-sifflet",
  ghost:
    "bg-transparent text-craie border border-craie/20 hover:border-craie/60 hover:bg-craie/5 active:scale-[0.98]",
  danger:
    "bg-red-600/90 hover:bg-red-600 text-white shadow-md hover:shadow-red-600/20 active:scale-[0.98] border border-red-500",
  booking:
    "bg-vert-projecteur text-encre font-black shadow-md hover:shadow-xl hover:shadow-vert-projecteur/30 hover:brightness-105 active:scale-[0.98] border border-vert-projecteur",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  "px-3 py-1.5 text-xs rounded-lg",
  md:  "px-4 py-2.5 text-sm rounded-xl",
  lg:  "px-6 py-3.5 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className, onClick, ...props }, _ref) => {
    const [scope, animate] = useAnimate();
    const ballRef = useRef<HTMLSpanElement>(null);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === "booking" && ballRef.current) {
        await animate(ballRef.current, { y: [0, -14, 0], scale: [1, 1.2, 1] }, { duration: 0.35 });
      }
      onClick?.(e);
    };

    return (
      <motion.button
        ref={scope}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
        disabled={loading || props.disabled}
      >
        {variant === "booking" && (
          <span ref={ballRef} className="inline-block text-sm" aria-hidden="true">⚽</span>
        )}
        {loading
          ? <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
          : icon
        }
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
