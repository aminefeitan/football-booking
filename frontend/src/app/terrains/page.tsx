"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Funnel,
  List,
  SquaresFour,
  X,
  Lightning,
  House,
  ArrowsDownUp,
  MapPin,
  SoccerBall,
} from "@phosphor-icons/react";
import { FieldCard } from "@/components/ui/FieldCard";
import { Button } from "@/components/ui/Button";
import { getFields, type FieldFilters } from "@/services/fields.service";
import { cn } from "@/lib/utils";
import { MOROCCAN_CITIES } from "@/lib/constants";
import { ProtectedRoute } from "@/context/AuthContext";

const CITY_OPTIONS = [
  { value: "", label: "Toutes les villes" },
  ...MOROCCAN_CITIES.map((c) => ({ value: c, label: c })),
];

const FORMAT_OPTIONS = [
  { value: "", label: "Tous formats" },
  { value: "5v5", label: "5 vs 5" },
  { value: "7v7", label: "7 vs 7" },
  { value: "11v11", label: "11 vs 11" },
];

const PRICE_OPTIONS = [
  { value: 0, label: "Tous prix" },
  { value: 300, label: "≤ 300 MAD/h" },
  { value: 450, label: "≤ 450 MAD/h" },
  { value: 600, label: "≤ 600 MAD/h" },
];

function TerrainsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchCity, setSearchCity] = useState(searchParams.get("city") ?? "");
  const [format, setFormat] = useState(searchParams.get("fieldType") ?? "");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [indoorOnly, setIndoorOnly] = useState<boolean>(false);
  const [lightsOnly, setLightsOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const queryFilters: FieldFilters = useMemo(
    () => ({
      city: searchCity.trim() || undefined,
      fieldType: format || undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      indoor: indoorOnly ? true : undefined,
      hasLights: lightsOnly ? true : undefined,
    }),
    [searchCity, format, maxPrice, indoorOnly, lightsOnly]
  );

  const { data: rawFields = [], isLoading } = useQuery({
    queryKey: ["fields", queryFilters],
    queryFn: () => getFields(queryFilters),
  });

  const sortedFields = useMemo(() => {
    const list = [...rawFields];
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [rawFields, sortBy]);

  const activeFiltersCount =
    (searchCity ? 1 : 0) +
    (format ? 1 : 0) +
    (maxPrice > 0 ? 1 : 0) +
    (indoorOnly ? 1 : 0) +
    (lightsOnly ? 1 : 0);

  const resetAllFilters = () => {
    setSearchCity("");
    setFormat("");
    setMaxPrice(0);
    setIndoorOnly(false);
    setLightsOnly(false);
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse text-craie pb-24">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-craie/10 bg-encre/60 backdrop-blur-xl py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vert-projecteur bg-vert-projecteur/10 px-3 py-1 rounded-full border border-vert-projecteur/20">
              Catalogue officiel · FootBook
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase text-craie tracking-tight leading-none">
              Trouver un <span className="text-vert-projecteur">terrain</span>
            </h1>
            <p className="text-sm text-craie/70 font-sans max-w-xl">
              Parcourez les meilleures pelouses synthétiques et indoor disponibles près de chez vous.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-craie/15 bg-encre/70 px-4 py-2 font-mono text-xs text-craie/70">
              <strong className="text-vert-projecteur font-black text-sm">{sortedFields.length}</strong> terrain(s) trouvé(s)
            </div>

            {/* Toggle View Mode */}
            <div className="rounded-xl border border-craie/15 bg-encre/70 p-1 flex items-center">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-vert-projecteur text-encre"
                    : "text-craie/50 hover:text-craie"
                )}
                title="Vue grille"
                aria-label="Vue grille"
              >
                <SquaresFour size={16} weight="bold" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-vert-projecteur text-encre"
                    : "text-craie/50 hover:text-craie"
                )}
                title="Vue liste"
                aria-label="Vue liste"
              >
                <List size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="border-b border-craie/10 bg-encre/40 backdrop-blur-md px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* City Selector */}
            <div className="md:col-span-2 flex items-center rounded-2xl border border-craie/15 bg-encre/80 px-4 py-2.5 focus-within:border-vert-projecteur/50 transition-all">
              <MapPin size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-3" />
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full bg-transparent text-craie text-sm font-sans outline-none cursor-pointer"
                aria-label="Filtrer par ville"
              >
                {CITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-encre text-craie">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center rounded-2xl border border-craie/15 bg-encre/80 px-4 py-2.5 focus-within:border-vert-projecteur/50 transition-all">
              <ArrowsDownUp size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-3" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full bg-transparent text-craie text-xs uppercase font-mono tracking-wider outline-none cursor-pointer"
                aria-label="Trier par"
              >
                <option value="price-asc" className="bg-encre text-craie">
                  Prix : Moins cher d'abord
                </option>
                <option value="price-desc" className="bg-encre text-craie">
                  Prix : Plus cher d'abord
                </option>
                <option value="name" className="bg-encre text-craie">
                  Nom : Ordre alphabétique
                </option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Format */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Format :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = format === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormat(opt.value)}
                        className={cn(
                          "px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer",
                          active
                            ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-sm shadow-vert-projecteur/20"
                            : "border-craie/10 bg-craie/5 text-craie/60 hover:text-craie hover:bg-craie/10"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Budget :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_OPTIONS.map((opt) => {
                    const active = maxPrice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setMaxPrice(opt.value)}
                        className={cn(
                          "px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer",
                          active
                            ? "border-jaune-carton bg-jaune-carton text-encre shadow-sm shadow-jaune-carton/20"
                            : "border-craie/10 bg-craie/5 text-craie/60 hover:text-craie hover:bg-craie/10"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Options :
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setIndoorOnly(!indoorOnly)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer",
                      indoorOnly
                        ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-sm"
                        : "border-craie/10 bg-craie/5 text-craie/60 hover:text-craie"
                    )}
                  >
                    <House size={14} weight="bold" />
                    Indoor
                  </button>

                  <button
                    onClick={() => setLightsOnly(!lightsOnly)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer",
                      lightsOnly
                        ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-sm"
                        : "border-craie/10 bg-craie/5 text-craie/60 hover:text-craie"
                    )}
                  >
                    <Lightning size={14} weight="fill" />
                    Éclairé
                  </button>
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-orange-sifflet hover:underline uppercase tracking-wider transition-colors ml-auto cursor-pointer"
              >
                <X size={14} weight="bold" />
                Effacer les filtres ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Grid ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-craie/10 bg-encre/40 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : sortedFields.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-craie/20 p-16 text-center max-w-md mx-auto my-12 bg-encre/30 space-y-4">
            <SoccerBall size={48} className="mx-auto text-craie/30" />
            <h3 className="font-display text-2xl font-black uppercase text-craie">
              Aucun terrain correspondant
            </h3>
            <p className="text-craie/60 text-sm font-sans">
              Modifiez vos critères ou réinitialisez les filtres pour afficher l'ensemble des terrains disponibles.
            </p>
            <Button variant="primary" size="sm" onClick={resetAllFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            )}
          >
            {sortedFields.map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <FieldCard
                  field={field}
                  onClick={() => router.push(`/terrains/${field.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function TerrainsPage() {
  return (
    <ProtectedRoute>
      <Suspense>
        <TerrainsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
