"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  label: string;
  status: "available" | "reserved" | "last_places";
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PitchPickerProps {
  fieldType?: "FIVE_ASIDE" | "SEVEN_ASIDE" | "ELEVEN_ASIDE";
  zones?: Zone[];
  selectedZone?: string;
  onSelect?: (zoneId: string) => void;
  className?: string;
}

const defaultZones: Zone[] = [
  { id: "left", label: "Terrain A", status: "available", x: 10, y: 20, w: 120, h: 100 },
  { id: "center", label: "Terrain B", status: "last_places", x: 150, y: 20, w: 120, h: 100 },
  { id: "right", label: "Terrain C", status: "reserved", x: 290, y: 20, w: 120, h: 100 },
];

const statusColors = {
  available: { fill: "#C8FF3D", stroke: "#0A0F0D", text: "#0A0F0D" },
  reserved: { fill: "#0A0F0D", stroke: "#C8FF3D", text: "#F5F0E1" },
  last_places: { fill: "#FF5B1F", stroke: "#0A0F0D", text: "#F5F0E1" },
};

export function PitchPicker({ zones = defaultZones, selectedZone, onSelect, className }: PitchPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={cn("w-full border-2 border-encre bg-nuit-pelouse overflow-hidden", className)}>
      <div className="px-4 py-2 border-b-2 border-encre bg-encre">
        <span className="font-display text-sm font-bold text-vert-projecteur uppercase tracking-widest">
          Choisir un terrain
        </span>
      </div>
      <svg
        viewBox="0 0 420 160"
        className="w-full"
        role="img"
        aria-label="Sélecteur de terrain vu du dessus"
      >
        {/* Grass background */}
        <rect width="420" height="160" fill="#0B2E22" />

        {/* Pitch lines - main field */}
        <rect x="5" y="5" width="410" height="150" fill="none" stroke="#C8FF3D" strokeWidth="1.5" opacity="0.3"/>
        <line x1="210" y1="5" x2="210" y2="155" stroke="#C8FF3D" strokeWidth="1" opacity="0.3"/>
        <circle cx="210" cy="80" r="25" fill="none" stroke="#C8FF3D" strokeWidth="1" opacity="0.3"/>
        <circle cx="210" cy="80" r="3" fill="#C8FF3D" opacity="0.3"/>
        {/* Goals */}
        <rect x="5" y="55" width="20" height="50" fill="none" stroke="#C8FF3D" strokeWidth="1" opacity="0.3"/>
        <rect x="395" y="55" width="20" height="50" fill="none" stroke="#C8FF3D" strokeWidth="1" opacity="0.3"/>

        {/* Zones interactives */}
        {zones.map((zone) => {
          const colors = statusColors[zone.status];
          const isSelected = selectedZone === zone.id;
          const isHovered = hovered === zone.id;
          const isDisabled = zone.status === "reserved";

          return (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                fill={colors.fill}
                fillOpacity={isDisabled ? 0.3 : isSelected || isHovered ? 0.9 : 0.6}
                stroke={isSelected ? "#FFD23F" : colors.stroke}
                strokeWidth={isSelected ? 3 : 2}
                className={!isDisabled ? "cursor-pointer" : "cursor-not-allowed"}
                onMouseEnter={() => !isDisabled && setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => !isDisabled && onSelect?.(zone.id)}
                rx={2}
              />
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 - 8}
                textAnchor="middle"
                fill={colors.text}
                fontSize="11"
                fontFamily="'DM Mono', monospace"
                fontWeight="bold"
              >
                {zone.label}
              </text>
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 + 10}
                textAnchor="middle"
                fill={colors.text}
                fontSize="9"
                fontFamily="'DM Mono', monospace"
                opacity={0.8}
              >
                {zone.status === "available" ? "LIBRE" : zone.status === "reserved" ? "RÉSERVÉ" : "DERNIÈRES"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t-2 border-encre bg-encre/50">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 border border-encre"
              style={{ backgroundColor: colors.fill }}
            />
            <span className="text-xs font-bold text-craie/70 uppercase font-mono">
              {status === "available" ? "Libre" : status === "reserved" ? "Réservé" : "Dernières places"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

