"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass, MapPin, SoccerBall, ArrowRight } from "@phosphor-icons/react";
import { Marquee } from "@/components/ui/Marquee";
import { FieldCard } from "@/components/ui/FieldCard";
import { Button } from "@/components/ui/Button";
import { getFields } from "@/services/fields.service";

const FIELD_TYPES = [
  { value: "",              label: "Tous" },
  { value: "FIVE_ASIDE",   label: "5 vs 5" },
  { value: "SEVEN_ASIDE",  label: "7 vs 7" },
  { value: "ELEVEN_ASIDE", label: "11 vs 11" },
];

const MARQUEE_ITEMS = [
  "Terrain du Parc libre ce soir 21h",
  "-20% tous les mardis",
  "Nouveau terrain indoor disponible à Lyon",
  "Réservez et payez sur place",
  "5 vs 5 · 7 vs 7 · 11 vs 11",
  "Vestiaires et douches inclus",
];

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [fieldType, setFieldType] = useState("");

  const { data: fields = [] } = useQuery({
    queryKey: ["fields"],
    queryFn: () => getFields(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (fieldType) p.set("fieldType", fieldType);
    router.push(`/terrains${p.toString() ? `?${p}` : ""}`);
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-nuit-pelouse px-4 pt-10 pb-10 md:pt-16 md:pb-14">

        {/* Chiffre déco arrière-plan */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-end pr-6 select-none overflow-hidden">
          <span className="font-display font-black text-vert-projecteur opacity-[0.04]" style={{ fontSize: "clamp(100px,22vw,320px)" }}>
            90'
          </span>
        </div>

        {/* Halo subtil */}
        <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-[0.08]"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #C8FF3D 0%, transparent 70%)" }} />

        {/* Contenu */}
        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
            <span className="inline-flex items-center gap-1.5 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-3 py-1 font-mono font-bold text-xs uppercase tracking-widest">
              <SoccerBall size={12} weight="fill" />
              Réservation de terrains
            </span>
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="font-display font-black text-craie uppercase leading-[0.9] mb-6"
            style={{ fontSize: "clamp(44px,9vw,100px)" }}
          >
            Réserve ton<br />
            <span className="text-vert-projecteur">terrain</span>
          </motion.h1>

          {/* Formulaire de recherche */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            onSubmit={handleSearch}
            className="border-2 border-encre bg-encre shadow-brutal-xl max-w-2xl"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Ville */}
              <div className="flex items-center gap-2 flex-1 border-b-2 sm:border-b-0 sm:border-r-2 border-encre/40 px-3 py-2.5">
                <MapPin size={15} weight="bold" className="text-vert-projecteur shrink-0" />
                <input
                  type="text"
                  placeholder="Ville (Paris, Lyon…)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 bg-transparent text-craie placeholder-craie/30 font-body text-sm outline-none"
                  aria-label="Ville"
                />
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 border-b-2 sm:border-b-0 sm:border-r-2 border-encre/40 px-3 py-2.5">
                <SoccerBall size={15} weight="bold" className="text-vert-projecteur shrink-0" />
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="bg-transparent text-craie text-sm outline-none cursor-pointer font-body"
                  aria-label="Type de terrain"
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value} className="bg-encre">{t.label}</option>
                  ))}
                </select>
              </div>

              {/* CTA */}
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-vert-projecteur text-encre px-5 py-2.5 font-display font-black text-sm uppercase tracking-widest hover:bg-orange-sifflet hover:text-craie transition-colors"
              >
                <MagnifyingGlass size={16} weight="bold" />
                Chercher
              </button>
            </div>
          </motion.form>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex gap-6 mt-6"
          >
            {[
              { v: "50+",    l: "Terrains" },
              { v: "1 000+", l: "Réservations/mois" },
              { v: "15",     l: "Villes" },
            ].map(({ v, l }) => (
              <div key={l}>
                <div className="font-mono font-black text-xl text-vert-projecteur">{v}</div>
                <div className="text-[10px] font-bold text-craie/40 uppercase tracking-widest font-mono">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────── */}
      <Marquee items={MARQUEE_ITEMS} />

      {/* ── TERRAINS POPULAIRES ──────────────────────────────────── */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div aria-hidden="true" className="font-display font-black text-vert-projecteur/8 text-6xl leading-none select-none -mb-3">
              5<span className="text-orange-sifflet/8">vs</span>5
            </div>
            <h2 className="font-display font-black text-craie uppercase text-3xl leading-none">
              Terrains <span className="text-vert-projecteur">populaires</span>
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/terrains")} icon={<ArrowRight size={14} weight="bold" />}>
            Voir tout
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fields.slice(0, 6).map((field, i) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
            >
              <FieldCard field={field} onClick={() => router.push(`/terrains/${field.id}`)} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA GÉRANT ───────────────────────────────────────────── */}
      <section className="border-t-2 border-encre bg-vert-projecteur px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-black text-encre uppercase text-2xl leading-tight mb-1">
              Tu gères un terrain ?
            </h2>
            <p className="text-encre/60 text-sm font-body">
              Rejoins la plateforme et gère tes réservations en temps réel.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => router.push("/auth?role=manager")}>
            Espace gérant
          </Button>
        </div>
      </section>
    </div>
  );
}
