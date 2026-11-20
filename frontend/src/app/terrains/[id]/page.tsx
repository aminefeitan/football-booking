"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Lightning, Car, Shower, Moon, Phone, ArrowLeft, Lock, User as UserIcon, Clock } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getFieldById, getFieldSlots } from "@/services/fields.service";
import { Button } from "@/components/ui/Button";
import { SlotBoard } from "@/components/booking/SlotBoard";
import { formatPrice, formatFieldType, formatSurface, formatWorkingHours } from "@/lib/utils";

interface Props { params: Promise<{ id: string }> }

export default function TerrainDetailPage({ params }: Props) {
  const { id }  = use(params);
  const router  = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: field, isLoading, error } = useQuery({
    queryKey: ["field", id],
    queryFn: () => getFieldById(id),
  });

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const { data: slots = [] } = useQuery({
    queryKey: ["field-slots", id, selectedDate],
    queryFn: () => getFieldSlots(id, selectedDate),
    enabled: !!field,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center">
      <span className="font-display text-vert-projecteur text-3xl animate-pulse">Chargement…</span>
    </div>
  );

  if (error || !field) return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col items-center justify-center gap-3">
      <div className="font-display text-craie/20 text-7xl">404</div>
      <Button variant="ghost" size="sm" onClick={() => router.back()}>Retour</Button>
    </div>
  );

  const equipment = [
    { icon: Lightning, label: "Éclairage",  active: field.hasLights     },
    { icon: Car,       label: "Parking",    active: field.hasParking     },
    { icon: Shower,    label: "Vestiaires", active: field.hasLockerRoom  },
    { icon: Moon,      label: "Couvert",    active: field.indoor         },
  ];

  return (
    <div className="min-h-screen bg-nuit-pelouse">
      <div className="max-w-5xl mx-auto px-4 py-5 pb-16">

        {/* Retour */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-craie/40 hover:text-craie text-xs font-mono font-bold uppercase tracking-widest mb-5 transition-colors"
          aria-label="Retour">
          <ArrowLeft size={14} weight="bold" /> Retour
        </button>

        {/* Visuel hero */}
        <div className="relative border-2 border-encre h-48 md:h-64 bg-encre/60 shadow-brutal-xl mb-6 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="800" height="300" fill="#0B2E22"/>
            <rect x="20" y="15" width="760" height="270" fill="none" stroke="#C8FF3D" strokeWidth="2.5"/>
            <line x1="400" y1="15" x2="400" y2="285" stroke="#C8FF3D" strokeWidth="1.5"/>
            <circle cx="400" cy="150" r="50" fill="none" stroke="#C8FF3D" strokeWidth="1.5"/>
            <circle cx="400" cy="150" r="6" fill="#C8FF3D"/>
            <rect x="20" y="105" width="65" height="90" fill="none" stroke="#C8FF3D" strokeWidth="1.5"/>
            <rect x="715" y="105" width="65" height="90" fill="none" stroke="#C8FF3D" strokeWidth="1.5"/>
          </svg>
          {/* Prix */}
          <div className="absolute bottom-3 right-3 bg-vert-projecteur text-encre border-2 border-encre px-3 py-1.5 shadow-brutal">
            <div className="font-mono font-black text-xl leading-none">{formatPrice(field.pricePerHour)}</div>
            <div className="font-mono font-bold text-xs">/ heure</div>
          </div>
          {/* Type */}
          <div className="absolute top-3 left-3">
            <span className="bg-orange-sifflet text-craie border-2 border-encre px-3 py-1 font-display font-black text-lg uppercase">
              {formatFieldType(field.fieldType)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infos */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="font-display font-black text-craie uppercase text-4xl leading-none mb-2">{field.name}</h1>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-craie/50 text-xs font-mono">
                  <MapPin size={12} weight="bold" />
                  {field.address}, {field.city}
                </div>
                {field.phone && (
                  <div className="flex items-center gap-1.5 text-craie/50 text-xs font-mono">
                    <Phone size={12} weight="bold" />
                    <a href={`tel:${field.phone}`} className="hover:text-vert-projecteur">{field.phone}</a>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-craie/70 text-xs font-mono">
                  <Clock size={12} weight="bold" className="text-vert-projecteur" />
                  <span>Horaires : <strong className="text-vert-projecteur">{formatWorkingHours(field.openTime, field.closeTime)}</strong></span>
                </div>
              </div>
            </div>

            {field.description && (
              <div className="border-l-4 border-vert-projecteur pl-3">
                <p className="text-craie/70 text-sm leading-relaxed">{field.description}</p>
              </div>
            )}

            {/* Équipements */}
            <div>
              <h2 className="font-display font-black text-craie uppercase text-xl mb-3">Équipements</h2>
              <div className="grid grid-cols-2 gap-2">
                {equipment.map(({ icon: Icon, label, active }) => (
                  <div key={label} className={`flex items-center gap-2 border-2 p-2.5 ${active ? "border-vert-projecteur/50 bg-vert-projecteur/8 text-vert-projecteur" : "border-craie/8 text-craie/25"}`}>
                    <Icon size={15} weight="bold" />
                    <span className="font-mono font-bold text-xs uppercase tracking-widest">{label}</span>
                    {active && <span className="ml-auto text-xs font-black">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Caractéristiques */}
            <div>
              <h2 className="font-display font-black text-craie uppercase text-xl mb-3">Caractéristiques</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Horaires",  value: formatWorkingHours(field.openTime, field.closeTime) },
                  { label: "Surface",   value: formatSurface(field.surfaceType ?? "SYNTHETIC") },
                  { label: "Capacité",  value: `${field.capacity ?? "—"} joueurs` },
                  { label: "Type",      value: formatFieldType(field.fieldType) },
                ].map(({ label, value }) => (
                  <div key={label} className="border-2 border-encre/20 p-2.5">
                    <div className="text-[10px] font-bold text-craie/30 uppercase tracking-widest font-mono mb-0.5">{label}</div>
                    <div className="font-bold text-craie text-sm">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Créneaux */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h2 className="font-display font-black text-craie uppercase text-xl">
                  Créneaux <span className="text-vert-projecteur">disponibles</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-craie/60 uppercase">Date :</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="border-2 border-encre/60 bg-encre text-craie px-2.5 py-1 text-xs font-mono outline-none focus:border-vert-projecteur"
                  />
                </div>
              </div>
              <SlotBoard
                slots={slots}
                onSelect={(time) => {
                  if (isAuthenticated) {
                    router.push(`/reserver?fieldId=${field.id}&date=${selectedDate}&time=${time}`);
                  } else {
                    router.push(`/auth?redirect=/reserver?fieldId=${field.id}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Sticky CTA */}
          <div>
            <div className="sticky top-16 border-2 border-encre bg-encre shadow-brutal-lg p-4 space-y-4">
              <div>
                <div className="font-mono font-black text-3xl text-vert-projecteur leading-none">
                  {formatPrice(field.pricePerHour, field.currency)}
                  <span className="text-sm text-craie/40">/h</span>
                </div>
                <div className="text-[10px] font-bold text-craie/30 uppercase tracking-widest font-mono mt-1">
                  {formatFieldType(field.fieldType)} · {field.city}
                </div>
                <div className="text-[11px] font-mono text-vert-projecteur flex items-center gap-1.5 mt-1">
                  <Clock size={12} weight="bold" />
                  <span>{formatWorkingHours(field.openTime, field.closeTime)}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Button
                  variant="booking" size="md" className="w-full shadow-brutal"
                  onClick={() => router.push(`/reserver?fieldId=${field.id}`)}
                >
                  Réserver maintenant
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <Button
                    variant="primary" size="md" className="w-full shadow-brutal"
                    onClick={() => router.push(`/auth?redirect=/reserver?fieldId=${field.id}`)}
                    icon={<UserIcon size={16} weight="bold" />}
                  >
                    Se connecter pour réserver
                  </Button>
                  <div className="p-2 border border-jaune-carton/40 bg-jaune-carton/10 text-jaune-carton text-[11px] font-mono leading-tight text-center">
                    🔒 Consultation publique. Connectez-vous avec un compte joueur pour valider ce créneau.
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] text-craie/30 font-mono uppercase">
                Annulation gratuite 24h avant
              </p>

              <div className="border-t border-encre/30 pt-3 space-y-1.5">
                {equipment.filter(e => e.active).map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-craie/50">
                    <Icon size={12} weight="bold" className="text-vert-projecteur" />
                    <span className="font-mono">{label} inclus</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
