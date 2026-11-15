"use client";

import { motion } from "framer-motion";
import { MapPin, Lightning, Moon, Clock } from "@phosphor-icons/react";
import { cn, formatPrice, formatFieldType, formatWorkingHours } from "@/lib/utils";
import type { Field } from "@/lib/types";

interface FieldCardProps {
  field: Field;
  onClick?: () => void;
  className?: string;
}

export function FieldCard({ field, onClick, className }: FieldCardProps) {
  return (
    <motion.article
      initial={{ rotate: -1.5 }}
      whileHover={{ rotate: 0, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "cursor-pointer border-2 border-encre bg-nuit-pelouse shadow-brutal",
        "hover:shadow-brutal-lg transition-shadow",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Voir le terrain ${field.name}`}
    >
      {/* Visuel terrain SVG */}
      <div className="relative h-32 w-full bg-encre/60 overflow-hidden border-b-2 border-encre">
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 320 128" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="316" height="124" stroke="#C8FF3D" strokeWidth="2"/>
          <line x1="160" y1="2" x2="160" y2="126" stroke="#C8FF3D" strokeWidth="1.5"/>
          <circle cx="160" cy="64" r="22" stroke="#C8FF3D" strokeWidth="1.5"/>
          <circle cx="160" cy="64" r="3" fill="#C8FF3D"/>
          <rect x="2" y="38" width="30" height="52" stroke="#C8FF3D" strokeWidth="1.5"/>
          <rect x="288" y="38" width="30" height="52" stroke="#C8FF3D" strokeWidth="1.5"/>
        </svg>

        {/* Type terrain */}
        <div className="absolute top-2 left-2">
          <span className="bg-encre text-vert-projecteur font-display font-black text-sm uppercase px-2 py-0.5 border border-vert-projecteur/40">
            {formatFieldType(field.fieldType)}
          </span>
        </div>

        {/* Prix */}
        <div className="absolute bottom-2 right-2 bg-vert-projecteur text-encre border border-encre px-2 py-0.5">
          <span className="font-mono font-black text-sm">{formatPrice(field.pricePerHour, field.currency)}</span>
          <span className="font-mono text-xs">/h</span>
        </div>

        {field.indoor && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-sifflet/90 text-craie font-mono font-bold text-xs px-1.5 py-0.5 border border-encre">
              INDOOR
            </span>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-display font-black text-craie uppercase text-base leading-tight tracking-tight">
          {field.name}
        </h3>

        <div className="flex items-center gap-1 text-craie/50 text-xs">
          <MapPin size={11} weight="bold" />
          <span className="font-mono">{field.city}{field.address ? ` · ${field.address}` : ""}</span>
        </div>

        {(field.openTime || field.closeTime) && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-vert-projecteur font-bold pt-0.5">
            <Clock size={11} weight="bold" />
            <span>{formatWorkingHours(field.openTime, field.closeTime)}</span>
          </div>
        )}

        <div className="flex gap-3 pt-0.5">
          {field.hasLights && (
            <span className="flex items-center gap-0.5 text-xs text-vert-projecteur font-bold uppercase font-mono">
              <Lightning size={10} weight="fill" />Éclairé
            </span>
          )}
          {field.hasLockerRoom && (
            <span className="text-xs text-craie/40 font-bold uppercase font-mono">Vestiaires</span>
          )}
          {field.hasParking && (
            <span className="text-xs text-craie/40 font-bold uppercase font-mono">Parking</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
