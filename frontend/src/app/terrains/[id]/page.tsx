"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin,
  Lightning,
  Car,
  Shower,
  Moon,
  Phone,
  ArrowLeft,
  Clock,
  CheckCircle,
  ShieldCheck,
  CalendarBlank,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getFieldById, getFieldSlots } from "@/services/fields.service";
import { Button } from "@/components/ui/Button";
import { SlotBoard } from "@/components/booking/SlotBoard";
import { FieldPhoto } from "@/components/ui/FieldPhoto";
import { formatPrice, formatFieldType, formatSurface, formatWorkingHours } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function TerrainDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
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

  if (isLoading)
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center">
        <span className="font-display text-vert-projecteur text-3xl animate-pulse">Chargement…</span>
      </div>
    );

  if (error || !field)
    return (
      <div className="min-h-screen bg-nuit-pelouse flex flex-col items-center justify-center gap-4">
        <div className="font-display text-craie/20 text-8xl">404</div>
        <p className="font-mono text-sm text-craie/60">Terrain introuvable ou indisponible.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          Retour au catalogue
        </Button>
      </div>
    );

  const equipment = [
    { icon: Lightning, label: "Éclairage nocturne", active: field.hasLights },
    { icon: Car, label: "Parking sécurisé", active: field.hasParking },
    { icon: Shower, label: "Vestiaires & Douches", active: field.hasLockerRoom },
    { icon: Moon, label: "Terrain couvert", active: field.indoor },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Back Navigation */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-craie/50 hover:text-craie text-xs font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
            aria-label="Retour"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Retour aux terrains</span>
          </button>

          {/* Hero Banner */}
          <div className="relative rounded-3xl h-64 md:h-80 bg-encre/70 border border-craie/10 shadow-2xl overflow-hidden">
            {field.photoUrl ? (
              <FieldPhoto photoUrl={field.photoUrl} alt={field.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-nuit-pelouse to-encre flex items-center justify-center opacity-40">
                <svg className="w-full h-full opacity-20" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="800" height="300" fill="#0B2E22"/>
                  <rect x="20" y="15" width="760" height="270" fill="none" stroke="#C8FF3D" strokeWidth="2.5"/>
                  <line x1="400" y1="15" x2="400" y2="285" stroke="#C8FF3D" strokeWidth="1.5"/>
                  <circle cx="400" cy="150" r="50" fill="none" stroke="#C8FF3D" strokeWidth="1.5"/>
                  <circle cx="400" cy="150" r="6" fill="#C8FF3D"/>
                </svg>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4">
              <span className="rounded-full bg-orange-sifflet text-craie px-3.5 py-1 font-mono font-bold text-xs uppercase shadow-md">
                {formatFieldType(field.fieldType)}
              </span>
            </div>

            <div className="absolute bottom-4 right-4 bg-vert-projecteur text-encre rounded-2xl px-4 py-2 shadow-lg backdrop-blur-md">
              <div className="font-mono font-black text-2xl leading-none">{formatPrice(field.pricePerHour)}</div>
              <div className="font-mono text-xs font-bold text-encre/70 text-right">/ heure</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Field Info & Slots */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Title */}
              <div className="space-y-3">
                <h1 className="font-display font-black text-craie uppercase text-4xl sm:text-5xl leading-none">
                  {field.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-craie/65">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} weight="bold" className="text-vert-projecteur" />
                    <span>{field.address}, {field.city}</span>
                  </div>
                  {field.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={16} weight="bold" className="text-vert-projecteur" />
                      <a href={`tel:${field.phone}`} className="hover:text-vert-projecteur">{field.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} weight="bold" className="text-vert-projecteur" />
                    <span>{formatWorkingHours(field.openTime, field.closeTime)}</span>
                  </div>
                </div>
              </div>

              {field.description && (
                <div className="rounded-2xl border-l-4 border-vert-projecteur bg-encre/40 p-4 border border-craie/5">
                  <p className="text-craie/80 text-sm leading-relaxed font-sans">{field.description}</p>
                </div>
              )}

              {/* Equipment Cards */}
              <div className="space-y-3">
                <h2 className="font-display font-black text-craie uppercase text-2xl">
                  Équipements & Installations
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {equipment.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                        active
                          ? "border-vert-projecteur/30 bg-vert-projecteur/10 text-vert-projecteur font-bold"
                          : "border-craie/10 bg-craie/5 text-craie/30"
                      }`}
                    >
                      <Icon size={18} weight="bold" />
                      <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
                      {active && <CheckCircle size={16} weight="fill" className="ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Characteristics */}
              <div className="space-y-3">
                <h2 className="font-display font-black text-craie uppercase text-2xl">
                  Fiche Technique
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Horaires", value: formatWorkingHours(field.openTime, field.closeTime) },
                    { label: "Surface", value: formatSurface(field.surfaceType ?? "SYNTHETIC") },
                    { label: "Capacité", value: `${field.capacity ?? "—"} joueurs` },
                    { label: "Format", value: formatFieldType(field.fieldType) },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-craie/10 bg-encre/60 p-3.5 space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-craie/40">{label}</div>
                      <div className="font-bold text-craie text-sm font-sans">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Slots Board */}
              <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-craie/10 pb-4">
                  <div>
                    <h2 className="font-display font-black text-craie uppercase text-2xl">
                      Créneaux <span className="text-vert-projecteur">disponibles</span>
                    </h2>
                    <p className="font-mono text-xs text-craie/50 mt-0.5">
                      Sélectionnez une date pour réserver votre heure de jeu
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarBlank size={16} className="text-vert-projecteur" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-vert-projecteur"
                    />
                  </div>
                </div>

                <SlotBoard
                  slots={slots}
                  onSelect={(time) => {
                    if (isAuthenticated) {
                      router.push(`/reserver?fieldId=${field.id}&date=${selectedDate}&time=${time}`);
                    } else {
                      router.push(`/login?redirect=/reserver?fieldId=${field.id}`);
                    }
                  }}
                />
              </div>
            </div>

            {/* Sticky Sidebar CTA */}
            <div>
              <div className="sticky top-20 rounded-3xl border border-craie/15 bg-encre/90 backdrop-blur-2xl shadow-2xl p-6 space-y-6">
                <div>
                  <div className="font-mono font-black text-4xl text-vert-projecteur leading-none">
                    {formatPrice(field.pricePerHour, field.currency)}
                    <span className="text-sm font-normal text-craie/40"> / heure</span>
                  </div>
                  <div className="text-xs font-mono text-craie/50 mt-1">
                    {formatFieldType(field.fieldType)} · {field.city}
                  </div>
                </div>

                {isAuthenticated ? (
                  <Button
                    variant="booking"
                    size="lg"
                    className="w-full shadow-lg shadow-vert-projecteur/25"
                    onClick={() => router.push(`/reserver?fieldId=${field.id}`)}
                  >
                    Réserver maintenant
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-lg"
                    onClick={() => router.push(`/login?redirect=/reserver?fieldId=${field.id}`)}
                  >
                    Se connecter pour réserver
                  </Button>
                )}

                <div className="rounded-2xl p-3 bg-vert-projecteur/5 border border-vert-projecteur/15 space-y-2 text-xs font-mono text-craie/70">
                  <div className="flex items-center gap-2 text-vert-projecteur font-bold">
                    <ShieldCheck size={16} weight="bold" />
                    <span>Garantie FootBook</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Confirmation rapide auprès du gérant. Paiement direct sur place au complexe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
