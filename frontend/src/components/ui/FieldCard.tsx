"use client";

import { motion } from "framer-motion";
import { MapPin, Lightning, Moon, Clock, ArrowUpRight } from "@phosphor-icons/react";
import { cn, formatPrice, formatFieldType, formatWorkingHours } from "@/lib/utils";
import { FieldPhoto } from "@/components/ui/FieldPhoto";
import type { Field } from "@/lib/types";

interface FieldCardProps {
  field: Field;
  onClick?: () => void;
  className?: string;
}

export function FieldCard({ field, onClick, className }: FieldCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "group cursor-pointer rounded-3xl border border-craie/10 bg-encre/75 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/20",
        "hover:border-vert-projecteur/40 hover:shadow-2xl hover:shadow-vert-projecteur/5 transition-all duration-300",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Voir le terrain ${field.name}`}
    >
      {/* Visuel terrain SVG ou Photo */}
      <div className="relative h-44 w-full bg-nuit-pelouse overflow-hidden border-b border-craie/10">
        {field.photoUrl ? (
          <FieldPhoto photoUrl={field.photoUrl} alt={field.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 320 128" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="316" height="124" stroke="#C8FF3D" strokeWidth="2"/>
            <line x1="160" y1="2" x2="160" y2="126" stroke="#C8FF3D" strokeWidth="1.5"/>
            <circle cx="160" cy="64" r="22" stroke="#C8FF3D" strokeWidth="1.5"/>
            <circle cx="160" cy="64" r="3" fill="#C8FF3D"/>
            <rect x="2" y="38" width="30" height="52" stroke="#C8FF3D" strokeWidth="1.5"/>
            <rect x="288" y="38" width="30" height="52" stroke="#C8FF3D" strokeWidth="1.5"/>
          </svg>
        )}

        {/* Type terrain Badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-encre/90 backdrop-blur-md text-vert-projecteur font-mono font-bold text-xs uppercase px-3 py-1 border border-vert-projecteur/30">
            {formatFieldType(field.fieldType)}
          </span>
        </div>

        {/* Prix Tag */}
        <div className="absolute bottom-3 right-3 bg-vert-projecteur text-encre rounded-xl px-3 py-1 shadow-md font-mono font-bold text-sm">
          <span>{formatPrice(field.pricePerHour, field.currency)}</span>
          <span className="text-xs font-normal"> / h</span>
        </div>

        {field.indoor && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-orange-sifflet/90 text-craie font-mono font-bold text-[10px] px-2.5 py-0.5 border border-orange-sifflet/40 backdrop-blur-sm">
              INDOOR
            </span>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-black text-craie uppercase text-xl leading-tight tracking-tight group-hover:text-vert-projecteur transition-colors">
            {field.name}
          </h3>
          <ArrowUpRight size={18} className="text-craie/40 group-hover:text-vert-projecteur group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-1.5 text-craie/60 text-xs font-mono">
          <MapPin size={14} className="text-vert-projecteur shrink-0" />
          <span className="truncate">{field.city}{field.address ? ` · ${field.address}` : ""}</span>
        </div>

        {(field.openTime || field.closeTime) && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-craie/75 pt-0.5">
            <Clock size={14} className="text-vert-projecteur shrink-0" />
            <span>{formatWorkingHours(field.openTime, field.closeTime)}</span>
          </div>
        )}

        {/* Equipments Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-craie/5 text-xs font-mono">
          {field.hasLights && (
            <span className="inline-flex items-center gap-1 text-[11px] text-vert-projecteur bg-vert-projecteur/10 px-2 py-0.5 rounded-full border border-vert-projecteur/20 font-bold">
              <Lightning size={12} weight="fill" /> Éclairé
            </span>
          )}
          {field.hasLockerRoom && (
            <span className="text-[11px] text-craie/60 bg-craie/5 px-2 py-0.5 rounded-full border border-craie/10 font-medium">
              Vestiaires
            </span>
          )}
          {field.hasParking && (
            <span className="text-[11px] text-craie/60 bg-craie/5 px-2 py-0.5 rounded-full border border-craie/10 font-medium">
              Parking
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
