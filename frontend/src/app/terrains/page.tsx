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
  { value: 60, label: "≤ 60€/h" },
  { value: 90, label: "≤ 90€/h" },
  { value: 120, label: "≤ 120€/h" },
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

  // Tri côté client
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
    <div className="min-h-screen bg-nuit-pelouse text-craie pb-16">
      {/* ── Entête de page ─────────────────────────────────────────── */}
      <div className="border-b-2 border-encre bg-encre/70 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-vert-projecteur mb-1">
              Catalogue officiel · FootBook
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-craie tracking-tight leading-none">
              Trouver un <span className="text-vert-projecteur">terrain</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-craie/60 bg-encre border border-craie/20 px-3 py-1.5">
              <strong className="text-vert-projecteur font-black">{sortedFields.length}</strong> terrain(s) disponible(s)
            </span>

            {/* Vue toggle */}
            <div className="border-2 border-encre bg-encre flex">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-vert-projecteur text-encre"
                    : "text-craie/40 hover:text-craie"
                )}
                title="Vue grille"
                aria-label="Vue grille"
              >
                <SquaresFour size={16} weight="bold" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-vert-projecteur text-encre"
                    : "text-craie/40 hover:text-craie"
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

      {/* ── Barre de Filtres Structurée et Ordonnée ─────────────────── */}
      <div className="border-b-2 border-encre bg-encre/40 px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Ligne 1 : Recherche ville + Tri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Select Ville */}
            <div className="md:col-span-2 flex items-center border-2 border-encre bg-encre px-3 py-2 shadow-brutal focus-within:border-vert-projecteur transition-colors">
              <MapPin size={16} weight="bold" className="text-vert-projecteur shrink-0 mr-2" />
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full bg-transparent text-craie text-sm font-body outline-none cursor-pointer"
                aria-label="Filtrer par ville"
              >
                {CITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-encre text-craie">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div className="flex items-center border-2 border-encre bg-encre px-3 py-2 shadow-brutal">
              <ArrowsDownUp size={16} weight="bold" className="text-vert-projecteur shrink-0 mr-2" />
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

          {/* Ligne 2 : Filtres pastilles ordonnés par catégorie */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Groupe 1: FORMAT */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Format :
                </span>
                <div className="flex flex-wrap gap-1">
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = format === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormat(opt.value)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wide border-2 transition-all",
                          active
                            ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                            : "border-encre bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Groupe 2: BUDGET */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Budget :
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRICE_OPTIONS.map((opt) => {
                    const active = maxPrice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setMaxPrice(opt.value)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wide border-2 transition-all",
                          active
                            ? "border-jaune-carton bg-jaune-carton text-encre shadow-brutal"
                            : "border-encre bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Groupe 3: COMMODITÉS */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-craie/40 mr-1">
                  Options :
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIndoorOnly(!indoorOnly)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wide border-2 transition-all",
                      indoorOnly
                        ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
                        : "border-encre bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                    )}
                  >
                    <House size={12} weight="bold" />
                    Indoor
                  </button>

                  <button
                    onClick={() => setLightsOnly(!lightsOnly)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wide border-2 transition-all",
                      lightsOnly
                        ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                        : "border-encre bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                    )}
                  >
                    <Lightning size={12} weight="fill" />
                    Éclairé
                  </button>
                </div>
              </div>
            </div>

            {/* Reset si des filtres sont actifs */}
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-xs font-mono font-bold text-orange-sifflet hover:underline uppercase tracking-wider transition-colors ml-auto"
              >
                <X size={12} weight="bold" />
                Effacer les filtres ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenu & Résultats ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-encre bg-encre/30 h-64 animate-pulse shadow-brutal"
              />
            ))}
          </div>
        ) : sortedFields.length === 0 ? (
          <div className="border-2 border-dashed border-encre/40 p-12 text-center max-w-md mx-auto my-12 bg-encre/20">
            <div className="font-display font-black text-6xl text-craie/20 mb-2">0</div>
            <h3 className="font-display text-2xl font-black uppercase text-craie mb-2">
              Aucun terrain correspondant
            </h3>
            <p className="text-craie/50 text-sm font-body mb-6">
              Modifie tes critères ou efface les filtres pour voir tous les terrains disponibles.
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
                transition={{ duration: 0.3, delay: i * 0.04 }}
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
