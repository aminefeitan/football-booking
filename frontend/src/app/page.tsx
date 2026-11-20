"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlass,
  MapPin,
  SoccerBall,
  ArrowRight,
  CalendarCheck,
  Ticket,
  ShieldCheck,
  Calendar,
} from "@phosphor-icons/react";
import { Marquee } from "@/components/ui/Marquee";
import { FieldCard } from "@/components/ui/FieldCard";
import { Button } from "@/components/ui/Button";
import { getFields } from "@/services/fields.service";

const FIELD_TYPES = [
  { value: "", label: "Tous formats" },
  { value: "5v5", label: "5 vs 5" },
  { value: "7v7", label: "7 vs 7" },
  { value: "11v11", label: "11 vs 11" },
];

const MARQUEE_ITEMS = [
  "Terrains synthétiques et naturels homologués",
  "Casablanca · Rabat · Marrakech · Tanger",
  "Paiement sur place auprès du gérant",
  "Foot à 5 · Foot à 7 · Foot à 11",
  "Création d'équipes et défis de matchs",
];

const QUICK_TAGS = [
  { label: "Foot à 5", type: "5v5" },
  { label: "Foot à 7", type: "7v7" },
  { label: "Foot à 11", type: "11v11" },
  { label: "Indoor 🏠", indoor: true },
];

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [date, setDate] = useState("");

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: () => getFields(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city.trim()) p.set("city", city.trim());
    if (fieldType) p.set("fieldType", fieldType);
    router.push(`/terrains${p.toString() ? `?${p}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse text-craie">
      {/* ── HERO SECTION CENTRÉE & ÉQUILIBRÉE ──────────────────────── */}
      <section className="relative overflow-hidden bg-nuit-pelouse px-4 pt-12 pb-16 md:pt-20 md:pb-24 border-b-2 border-encre">
        {/* Lignes de terrain en filigrane centré */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] select-none"
        >
          <svg className="w-[900px] h-[500px]" viewBox="0 0 900 500" fill="none">
            <rect x="20" y="20" width="860" height="460" stroke="#C8FF3D" strokeWidth="4" />
            <line x1="450" y1="20" x2="450" y2="480" stroke="#C8FF3D" strokeWidth="3" />
            <circle cx="450" cy="250" r="80" stroke="#C8FF3D" strokeWidth="3" />
            <circle cx="450" cy="250" r="10" fill="#C8FF3D" />
            <rect x="20" y="150" width="100" height="200" stroke="#C8FF3D" strokeWidth="3" />
            <rect x="780" y="150" width="100" height="200" stroke="#C8FF3D" strokeWidth="3" />
          </svg>
        </div>

        {/* Halo de projecteur central */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-10"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, #C8FF3D 0%, transparent 70%)",
          }}
        />

        {/* Contenu Hero Centré */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge officiel centré */}
          <div className="inline-flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-1.5 font-mono font-bold text-xs uppercase tracking-widest mb-6 shadow-brutal">
            <SoccerBall size={16} weight="fill" />
            Plateforme officielle de réservation de football
          </div>

          {/* Titre géant centré */}
          <h1
            className="font-display font-black text-craie uppercase leading-[0.9] mb-6 tracking-tight"
            style={{ fontSize: "clamp(44px, 7.5vw, 88px)" }}
          >
            RÉSERVE TON <span className="text-vert-projecteur">TERRAIN</span>
            <br />
            <span className="text-craie/90">DE MATCH EN VILLE</span>
          </h1>

          {/* Sous-titre centré */}
          <p className="text-craie/70 font-body text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Foot à 5, 7 ou 11. Compare les prix, consulte les créneaux libres en temps réel
            et obtiens ton billet officiel de match en quelques secondes.
          </p>

          {/* Carte de recherche centrale, équilibrée & structurée */}
          <div className="w-full max-w-3xl border-2 border-encre bg-encre p-4 shadow-brutal-xl">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Ville (5 cols) */}
                <div className="sm:col-span-5 flex items-center border-2 border-encre/60 bg-nuit-pelouse px-3 py-2.5 focus-within:border-vert-projecteur transition-colors">
                  <MapPin size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Ville (Paris, Lyon, Marseille)..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-craie placeholder-craie/30 text-sm font-body outline-none"
                    aria-label="Ville de réservation"
                  />
                </div>

                {/* Format (4 cols) */}
                <div className="sm:col-span-4 flex items-center border-2 border-encre/60 bg-nuit-pelouse px-3 py-2.5 focus-within:border-vert-projecteur transition-colors">
                  <SoccerBall size={18} weight="bold" className="text-vert-projecteur shrink-0 mr-2" />
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full bg-transparent text-craie text-xs uppercase font-mono tracking-wider outline-none cursor-pointer"
                    aria-label="Format du terrain"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-encre text-craie">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CTA Bouton (3 cols) */}
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full h-full min-h-[44px] flex items-center justify-center gap-2 bg-vert-projecteur text-encre font-display font-black text-base uppercase tracking-widest hover:bg-orange-sifflet hover:text-craie transition-colors cursor-pointer border-2 border-encre shadow-brutal"
                  >
                    <MagnifyingGlass size={18} weight="bold" />
                    Chercher
                  </button>
                </div>
              </div>

              {/* Raccourcis rapides centrés */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-encre/50">
                <span className="text-[11px] font-mono text-craie/40 uppercase tracking-wider">
                  Accès direct :
                </span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => {
                      const p = new URLSearchParams();
                      if (tag.type) p.set("fieldType", tag.type);
                      if (tag.indoor) p.set("indoor", "true");
                      router.push(`/terrains?${p.toString()}`);
                    }}
                    className="text-xs font-mono font-bold text-craie/80 hover:text-vert-projecteur bg-nuit-pelouse/80 border border-craie/20 hover:border-vert-projecteur px-3 py-1 transition-all shadow-brutal hover:-translate-y-0.5"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Tableau de statistiques scoreboard centré */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-10 pt-8 border-t-2 border-encre/50 w-full">
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-vert-projecteur">50+</div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-craie/50 mt-1">
                Terrains vérifiés
              </div>
            </div>
            <div className="text-center border-x-2 border-encre/50 px-4">
              <div className="font-mono font-black text-3xl text-orange-sifflet">100%</div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-craie/50 mt-1">
                Dispo en direct
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-jaune-carton">24/7</div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-craie/50 mt-1">
                Réservation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANDEAU MARQUEE DÉFILANT ─────────────────────────────── */}
      <Marquee items={MARQUEE_ITEMS} />

      {/* ── TERRAINS POPULAIRES (CENTRÉ & ÉQUILIBRÉ) ──────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b-2 border-encre">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-vert-projecteur mb-1">
              Les plus réservés cette semaine
            </div>
            <h2 className="font-display font-black text-3xl md:text-5xl uppercase text-craie tracking-tight">
              Terrains <span className="text-vert-projecteur">populaires</span>
            </h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/terrains")}
            icon={<ArrowRight size={14} weight="bold" />}
          >
            Voir tous les terrains ({fields.length})
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-encre bg-encre/30 h-64 animate-pulse shadow-brutal"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.slice(0, 6).map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <FieldCard field={field} onClick={() => router.push(`/terrains/${field.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMMENT ÇA MARCHE (SCOREBOARD STYLE) ─────────────────── */}
      <section className="border-y-2 border-encre bg-encre/60 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="max-w-xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-vert-projecteur">
              Simple · Rapide · Efficace
            </span>
            <h2 className="font-display font-black text-3xl md:text-5xl uppercase text-craie mt-1">
              Comment ça <span className="text-vert-projecteur">marche</span> ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                step: "01",
                icon: MapPin,
                title: "Choisis ton terrain",
                desc: "Filtre par ville, surface (synthétique, indoor) et format (5v5, 7v7, 11v11).",
              },
              {
                step: "02",
                icon: CalendarCheck,
                title: "Sélectionne ton créneau",
                desc: "Vérifie les disponibilités en direct sur le tableau de créneaux et réserve ton heure.",
              },
              {
                step: "03",
                icon: Ticket,
                title: "Reçois ton billet",
                desc: "Un billet officiel avec QR code t'attend. Présente-le au complexe et joue !",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="border-2 border-encre bg-nuit-pelouse p-6 shadow-brutal relative overflow-hidden"
              >
                <div className="font-display font-black text-6xl text-vert-projecteur/10 absolute right-4 top-2 select-none">
                  {step}
                </div>
                <div className="w-10 h-10 border-2 border-vert-projecteur bg-vert-projecteur text-encre flex items-center justify-center font-bold mb-4 shadow-brutal">
                  <Icon size={20} weight="bold" />
                </div>
                <h3 className="font-display font-black text-xl uppercase text-craie mb-2">
                  {title}
                </h3>
                <p className="text-craie/60 text-sm font-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION GÉRANT DE TERRAIN ────────────────────────────── */}
      <section className="bg-vert-projecteur text-encre px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-encre/60 mb-1">
              Propriétaires & Complexes sportifs
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase text-encre leading-none mb-2">
              Vous possédez un terrain ?
            </h2>
            <p className="text-encre/80 font-body text-sm md:text-base max-w-xl">
              Augmentez votre taux d'occupation, gérez vos créneaux en direct et encaissez sans friction.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push("/auth?role=manager")}
            className="shrink-0"
          >
            Accéder à l'espace gérant
          </Button>
        </div>
      </section>
    </div>
  );
}
