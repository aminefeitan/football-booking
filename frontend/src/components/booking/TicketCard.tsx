"use client";

import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

interface TicketCardProps {
  booking: Booking;
  className?: string;
}

function QRCode({ value }: { value: string }) {
  // Simple QR code placeholder - pattern simulé
  const size = 60;
  const cells = 9;
  const cellSize = size / cells;
  // Pseudo-random pattern basé sur le hash
  const pattern = value.split("").map((c) => c.charCodeAt(0) % 2 === 0);

  return (
    <svg width={size} height={size} className="border-2 border-encre bg-white">
      {Array.from({ length: cells }).map((_, row) =>
        Array.from({ length: cells }).map((_, col) => {
          const idx = (row * cells + col) % pattern.length;
          // Corner squares (required for QR)
          const isCorner =
            (row < 3 && col < 3) ||
            (row < 3 && col >= cells - 3) ||
            (row >= cells - 3 && col < 3);
          const fill = isCorner || pattern[idx] ? "#0A0F0D" : "white";
          return (
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

function Perforations({ count = 12 }: { count?: number }) {
  return (
    <div className="flex items-center justify-around py-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-nuit-pelouse border-2 border-encre/20"
        />
      ))}
    </div>
  );
}

export function TicketCard({ booking, className }: TicketCardProps) {
  const statusColor =
    booking.status === "CONFIRMED"
      ? "text-vert-projecteur"
      : booking.status === "PENDING"
      ? "text-jaune-carton"
      : booking.status === "CANCELLED"
      ? "text-red-400"
      : "text-craie/50";

  return (
    <div
      className={cn(
        "border-2 border-dashed border-encre bg-craie text-encre overflow-hidden",
        "shadow-[6px_6px_0_#0A0F0D]",
        className
      )}
    >
      {/* Header du billet */}
      <div className="bg-nuit-pelouse px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-display text-xs font-bold text-vert-projecteur uppercase tracking-widest mb-1">
            FootBook
          </div>
          <div className="font-display text-2xl font-black text-craie uppercase leading-none">
            {booking.fieldName ?? "Terrain"}
          </div>
          <div className="font-mono text-sm text-craie/60 mt-1">
            Réservation FootBook
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-display text-sm font-black uppercase", statusColor)}>
            {booking.status}
          </div>
          <div className="font-mono text-xs text-craie/40 mt-1">
            #{booking.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Perforations */}
      <div className="bg-nuit-pelouse">
        <Perforations />
      </div>

      {/* Corps du billet */}
      <div className="px-6 py-4 flex items-stretch gap-4">
        {/* Infos principales */}
        <div className="flex-1 space-y-4">
          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-encre/40 uppercase tracking-widest mb-1">Date</div>
              <div className="font-mono text-sm font-bold text-encre">
                {formatDate(booking.startAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-encre/40 uppercase tracking-widest mb-1">Horaire</div>
              <div className="font-mono text-2xl font-black text-encre tracking-wider">
                {formatTime(booking.startAt)}
                <span className="text-encre/40"> – </span>
                {formatTime(booking.endAt)}
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <div className="text-xs font-bold text-encre/40 uppercase tracking-widest mb-1">Total</div>
            <div className="font-mono text-3xl font-black text-encre">
              {formatPrice(booking.totalAmount, booking.currency)}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="border-l-4 border-orange-sifflet pl-3">
              <div className="text-xs font-bold text-encre/40 uppercase tracking-widest mb-1">Note</div>
              <div className="text-sm text-encre">{booking.notes}</div>
            </div>
          )}
        </div>

        {/* Séparateur vertical pointillé */}
        <div className="border-l-2 border-dashed border-encre/30 mx-2" />

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center gap-2 min-w-[80px]">
          <QRCode value={booking.id} />
          <div className="font-mono text-xs text-encre/40 text-center">
            {booking.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Footer du billet */}
      <div className="bg-encre/10 px-6 py-2 border-t-2 border-dashed border-encre/30">
        <div className="font-mono text-xs text-encre/50 text-center uppercase tracking-widest">
          Présentez ce billet à l'accueil · FootBook · 2024
        </div>
      </div>
    </div>
  );
}

