"use client";

import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface Step { label: string }

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav className={cn("flex items-center", className)} aria-label="Étapes de réservation">
      {steps.map((step, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              {/* Cercle */}
              <div
                className={cn(
                  "w-7 h-7 border-2 border-encre flex items-center justify-center font-mono font-bold text-xs transition-colors",
                  done   && "bg-vert-projecteur text-encre",
                  active && "bg-orange-sifflet text-craie",
                  !done && !active && "bg-nuit-pelouse text-craie/30"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check size={13} weight="bold" /> : <span className="font-display">{i + 1}</span>}
              </div>
              {/* Label */}
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest font-mono",
                active ? "text-orange-sifflet" : done ? "text-vert-projecteur" : "text-craie/30"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connecteur */}
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 mt-[-14px]", done ? "bg-vert-projecteur" : "bg-craie/15")} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
