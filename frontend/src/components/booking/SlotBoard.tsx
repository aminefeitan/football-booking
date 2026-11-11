"use client";

import { cn } from "@/lib/utils";

interface SlotStatus {
  time: string;
  status: "available" | "reserved" | "last_places";
}

interface SlotBoardProps {
  slots: SlotStatus[];
  selectedTime?: string;
  onSelect?: (time: string) => void;
  className?: string;
}

const CFG = {
  available:   { bg: "bg-vert-projecteur",  text: "text-encre",    label: "LIBRE",           labelC: "text-encre/60"   },
  reserved:    { bg: "bg-encre",            text: "text-craie/25",  label: "RÉSERVÉ",         labelC: "text-craie/25"   },
  last_places: { bg: "bg-orange-sifflet",   text: "text-craie",    label: "DERNIÈRES PLACES", labelC: "text-craie/70"  },
};

export function SlotBoard({ slots, selectedTime, onSelect, className }: SlotBoardProps) {
  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-2", className)} role="listbox" aria-label="Créneaux horaires">
      {slots.map((slot) => {
        const c = CFG[slot.status];
        const selected  = selectedTime === slot.time;
        const disabled  = slot.status === "reserved";

        return (
          <button
            key={slot.time}
            role="option"
            aria-selected={selected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && onSelect?.(slot.time)}
            className={cn(
              "border-2 py-3 text-center transition-all duration-150",
              c.bg,
              selected  && "ring-2 ring-offset-1 ring-offset-nuit-pelouse ring-jaune-carton shadow-[4px_4px_0_#FFD23F]",
              !disabled && !selected && "hover:scale-105 shadow-brutal",
              disabled  && "cursor-not-allowed opacity-50"
            )}
          >
            <div className={cn("font-mono font-black text-xl tracking-wider leading-none", c.text)}>
              {slot.time}
            </div>
            <div className={cn("font-mono font-bold text-[9px] uppercase tracking-widest mt-1", c.labelC)}>
              {c.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
