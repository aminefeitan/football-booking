"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SoccerBall,
  UsersThree,
  CalendarCheck,
  ShieldCheck,
  Lightning,
  MapPin,
  Clock,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";

const FEATURES = [
  {
    icon: SoccerBall,
    title: "Recherche de terrains",
    desc: "Découvrez les terrains synthétiques et naturels disponibles dans votre ville avec horaires, tarifs et équipements.",
    color: "green",
  },
  {
    icon: UsersThree,
    title: "Équipes et Défis",
    desc: "Créez votre club, invitez vos coéquipiers et organisez des matchs compétitifs en quelques clics.",
    color: "yellow",
  },
  {
    icon: CalendarCheck,
    title: "Réservation en direct",
    desc: "Choisissez votre créneau horaire, réservez pour votre match et payez en direct sur place au gérant.",
    color: "orange",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructures vérifiées",
    desc: "Tous les terrains sont contrôlés et validés par l'administration avant d'être ouverts aux réservations.",
    color: "green",
  },
];

const METRICS = [
  { value: "100%", label: "Terrains vérifiés" },
  { value: "24/7", label: "Réservation en ligne" },
  { value: "< 2 min", label: "Organisation d'un match" },
  { value: "0 MAD", label: "Frais cachés" },
];

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin");
      } else if (user.role === "FIELD_MANAGER") {
        router.replace("/dashboard");
      } else {
        router.replace("/terrains");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-vert-projecteur">
          <SoccerBall size={24} className="animate-spin" />
          <p className="font-mono text-sm tracking-widest uppercase">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-vert-projecteur/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-orange-sifflet/5 blur-[140px] rounded-full pointer-events-none" />

      <div>
        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-4 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-vert-projecteur/30 bg-vert-projecteur/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-vert-projecteur backdrop-blur-md shadow-sm shadow-vert-projecteur/10">
              <SoccerBall size={16} weight="fill" className="text-vert-projecteur shrink-0" />
              <span>Plateforme N°1 de réservation au Maroc</span>
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase text-craie leading-[1.05] tracking-tight">
              Réservez votre terrain. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vert-projecteur via-vert-projecteur/90 to-jaune-carton">
                Jouez sans attendre.
              </span>
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-craie/75 text-base sm:text-lg font-sans leading-relaxed">
              FootBook connecte les passionnés de football aux meilleurs complexes et terrains de votre ville.
              Organisez vos matchs, composez vos équipes et validez vos créneaux en toute simplicité.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button variant="booking" size="lg" className="shadow-lg shadow-vert-projecteur/25 text-sm sm:text-base px-8 py-4">
                  Créer un compte Joueur
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="border border-craie/20 text-craie text-sm sm:text-base px-8 py-4 hover:border-craie/60">
                  Se connecter
                </Button>
              </Link>
            </div>

            {/* Stats Highlights Bar */}
            <div className="pt-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-encre/60 backdrop-blur-xl border border-craie/10">
                {METRICS.map((m, i) => (
                  <div key={i} className="text-center p-2">
                    <div className="font-display font-black text-2xl sm:text-3xl text-vert-projecteur">
                      {m.value}
                    </div>
                    <div className="font-mono text-xs text-craie/60 uppercase tracking-wider mt-0.5">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-24 text-left">
            {FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-2xl bg-encre/70 backdrop-blur-xl border border-craie/10 p-6 space-y-4 hover:border-vert-projecteur/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-vert-projecteur/10 text-vert-projecteur border border-vert-projecteur/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className="font-display font-black text-xl uppercase text-craie tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-craie/65 text-xs font-sans leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
