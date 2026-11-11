"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Funnel, List, SquaresFour, X } from "@phosphor-icons/react";
import { FieldCard } from "@/components/ui/FieldCard";
import { Button } from "@/components/ui/Button";
import { getFields, type FieldFilters } from "@/services/fields.service";
import { cn } from "@/lib/utils";

const TYPE_OPTS  = [
  { v: "FIVE_ASIDE",   l: "5 vs 5"   },
  { v: "SEVEN_ASIDE",  l: "7 vs 7"   },
  { v: "ELEVEN_ASIDE", l: "11 vs 11" },
];
const PRICE_OPTS = [
  { v: 50,  l: "≤ 50€/h"  },
  { v: 80,  l: "≤ 80€/h"  },
  { v: 120, l: "≤ 120€/h" },
];

function PillBtn({ active, color = "green", onClick, children }: {
  active?: boolean; color?: "green" | "yellow" | "orange"; onClick: () => void; children: React.ReactNode;
}) {
  const colorMap = {
    green:  active ? "border-vert-projecteur bg-vert-projecteur text-encre"   : "",
    yellow: active ? "border-jaune-carton bg-jaune-carton text-encre"         : "",
    orange: active ? "border-orange-sifflet bg-orange-sifflet text-craie"     : "",
  };
  return (
    <button onClick={onClick}
      className={cn(
        "border-2 px-3 py-1 font-mono font-bold text-xs uppercase tracking-widest transition-all",
        active ? colorMap[color] : "border-craie/20 text-craie/50 hover:border-craie/40 hover:text-craie/70"
      )}
    >
      {children}
    </button>
  );
}

function TerrainsContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [filters, setFilters] = useState<FieldFilters>({
    city: sp.get("city") ?? undefined,
    fieldType: sp.get("fieldType") ?? undefined,
  });
  const [view, setView]           = useState<"grid" | "list">("grid");
  const [showFilters, setShow]    = useState(false);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields", filters],
    queryFn: () => getFields(filters),
  });

  const toggle = (key: keyof FieldFilters, val: unknown) =>
    setFilters(p => ({ ...p, [key]: p[key] === val ? undefined : val }));

  const count = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-nuit-pelouse">

      {/* En-tête */}
      <div className="border-b-2 border-encre/40 px-4 py-6 max-w-6xl mx-auto">
        <div aria-hidden="true" className="font-display font-black text-vert-projecteur/8 text-5xl leading-none select-none -mb-2">TERRAINS</div>
        <div className="flex items-end justify-between">
          <h1 className="font-display font-black text-craie uppercase text-3xl leading-none">
            {fields.length} <span className="text-vert-projecteur">terrain{fields.length !== 1 ? "s" : ""}</span>
          </h1>
          <div className="flex items-center gap-2">
            {/* Filtres toggle */}
            <button
              onClick={() => setShow(v => !v)}
              className={cn("flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono font-bold text-xs uppercase tracking-widest transition-colors",
                showFilters ? "border-vert-projecteur bg-vert-projecteur text-encre" : "border-craie/20 text-craie/50 hover:border-craie/40")}
              aria-expanded={showFilters}
            >
              <Funnel size={12} weight="bold" />
              Filtres
              {count > 0 && <span className="bg-orange-sifflet text-craie text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">{count}</span>}
            </button>
            {/* Vue grille/liste */}
            <div className="border-2 border-craie/20 flex">
              {([["grid", SquaresFour], ["list", List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v as "grid" | "list")}
                  className={cn("p-1.5 transition-colors", view === v ? "bg-vert-projecteur text-encre" : "text-craie/40 hover:text-craie")}
                  aria-pressed={view === v} aria-label={`Vue ${v}`}>
                  <Icon size={15} weight="bold" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres en pastilles */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b-2 border-encre/30 bg-encre/30"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-craie/30 uppercase tracking-widest font-mono mr-1">Type :</span>
                {TYPE_OPTS.map(({ v, l }) => <PillBtn key={v} active={filters.fieldType === v} onClick={() => toggle("fieldType", v)}>{l}</PillBtn>)}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-craie/30 uppercase tracking-widest font-mono mr-1">Prix :</span>
                {PRICE_OPTS.map(({ v, l }) => <PillBtn key={v} color="yellow" active={filters.maxPrice === v} onClick={() => toggle("maxPrice", v)}>{l}</PillBtn>)}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-craie/30 uppercase tracking-widest font-mono mr-1">Éqpt :</span>
                <PillBtn color="orange" active={!!filters.indoor}    onClick={() => toggle("indoor", true)}>Indoor</PillBtn>
                <PillBtn color="orange" active={!!filters.hasLights} onClick={() => toggle("hasLights", true)}>Éclairé</PillBtn>
              </div>
              {count > 0 && (
                <button onClick={() => setFilters({})} className="flex items-center gap-1 text-xs text-orange-sifflet font-mono uppercase tracking-widest hover:underline">
                  <X size={11} weight="bold" />Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-2 border-encre bg-encre/20 h-52 animate-pulse" />
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="font-display font-black text-craie/15 text-6xl">0</div>
            <p className="text-craie/40 font-mono text-sm uppercase">Aucun terrain trouvé</p>
            <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Réinitialiser</Button>
          </div>
        ) : (
          <div className={cn(view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-3")}>
            {fields.map((field, i) => (
              <motion.div key={field.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <FieldCard field={field} onClick={() => router.push(`/terrains/${field.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TerrainsPage() {
  return <Suspense><TerrainsContent /></Suspense>;
}
