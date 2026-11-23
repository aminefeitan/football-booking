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

export function SlotBoard({ slots, selectedTime, onSelect, className }: SlotBoardProps) {
  if (!slots || slots.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-craie/20 p-8 text-center bg-encre/40", className)}>
        <p className="font-mono text-sm text-craie/70 font-semibold">
          Aucun créneau disponible pour cette date.
        </p>
        <p className="font-mono text-xs text-craie/40 mt-1">
          Tous les créneaux d'aujourd'hui sont passés ou déjà réservés. Veuillez choisir une autre date.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5", className)} role="listbox" aria-label="Créneaux horaires">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        const isAvailable = slot.status === "available" || slot.status === "last_places";
        const isLast = slot.status === "last_places";

        return (
          <button
            key={slot.time}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-disabled={!isAvailable}
            disabled={!isAvailable}
            onClick={() => isAvailable && onSelect?.(slot.time)}
            className={cn(
              "rounded-xl p-3 text-center transition-all duration-200 border cursor-pointer",
              isAvailable && !isSelected && (isLast
                ? "bg-orange-sifflet/15 border-orange-sifflet/40 text-orange-sifflet hover:bg-orange-sifflet hover:text-craie"
                : "bg-vert-projecteur/10 border-vert-projecteur/30 text-vert-projecteur hover:bg-vert-projecteur hover:text-encre hover:shadow-lg hover:shadow-vert-projecteur/20"),
              isSelected && "bg-vert-projecteur text-encre font-black border-vert-projecteur shadow-lg shadow-vert-projecteur/30 scale-105",
              !isAvailable && "bg-craie/5 border-craie/5 text-craie/25 cursor-not-allowed opacity-50"
            )}
          >
            <div className="font-mono font-bold text-lg leading-tight">
              {slot.time}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider font-semibold mt-1">
              {slot.status === "available" ? "Disponible" : slot.status === "last_places" ? "Dernières" : "Occupé"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
