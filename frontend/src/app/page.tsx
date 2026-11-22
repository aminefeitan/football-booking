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
  SignIn,
  UserPlus,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Footer } from "@/components/ui/Footer";

const MARQUEE_ITEMS = [
  "Plateforme officielle FootBook",
  "Casablanca · Rabat · Marrakech · Tanger",
  "Terrains 5v5 · 7v7 · 11v11",
  "Gestion d'équipes et défis de matchs",
  "Réservation simple et sécurisée",
];

const FEATURES = [
  {
    icon: SoccerBall,
    title: "Recherche de terrains",
    desc: "Découvrez les terrains synthétiques et naturels disponibles dans votre ville avec horaires et équipements.",
  },
  {
    icon: UsersThree,
    title: "Équipes et Défis",
    desc: "Créez votre équipe, invitez vos amis et organisez des matchs compétitifs en quelques clics.",
  },
  {
    icon: CalendarCheck,
    title: "Réservation en direct",
    desc: "Choisissez votre créneau horaire, réservez pour votre match et payez directement sur place au gérant.",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructures vérifiées",
    desc: "Tous les terrains sont contrôlés et validés par l'administration avant d'être ouverts aux réservations.",
  },
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
        <p className="font-mono text-sm text-craie/60 uppercase tracking-widest animate-pulse">
          Chargement…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse flex flex-col justify-between">
      <div>
        {/* Top bar */}
        <header className="border-b-2 border-encre bg-nuit-pelouse/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-vert-projecteur border-2 border-encre flex items-center justify-center font-display font-black text-encre text-base shadow-brutal-sm group-hover:-translate-y-0.5 transition-transform">
              FB
            </div>
            <span className="font-display font-black text-2xl uppercase tracking-wider text-craie">
              Foot<span className="text-vert-projecteur">Book</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                <SignIn size={15} weight="bold" />
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="font-mono text-xs shadow-brutal-sm">
                <UserPlus size={15} weight="bold" />
                Inscription
              </Button>
            </Link>
          </div>
        </header>

        {/* Marquee ticker */}
        <div className="border-b-2 border-encre bg-jaune-carton text-encre py-1">
          <Marquee items={MARQUEE_ITEMS} />
        </div>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-block bg-vert-projecteur/10 text-vert-projecteur border border-vert-projecteur/30 px-3 py-1 font-mono text-xs uppercase tracking-widest">
              Plateforme N°1 de réservation au Maroc
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase text-craie leading-none tracking-tight">
              Réservez votre terrain. <br />
              <span className="text-vert-projecteur">Jouez sans attendre.</span>
            </h1>

            <p className="max-w-2xl mx-auto text-craie/70 text-base sm:text-lg font-sans leading-relaxed">
              FootBook connecte les passionnés de football aux meilleurs terrains et gérants de votre ville.
              Organisez vos matchs, composez vos équipes et validez vos créneaux en toute simplicité.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button variant="booking" size="lg" className="shadow-brutal text-sm sm:text-base px-8 py-4">
                  Créer un compte Joueur
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="border-2 border-craie/20 text-craie text-sm sm:text-base px-8 py-4">
                  Se connecter
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 text-left">
            {FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-encre/40 border-2 border-encre/80 p-5 space-y-3 shadow-brutal-sm hover:border-vert-projecteur/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-vert-projecteur/10 text-vert-projecteur border border-vert-projecteur/30 flex items-center justify-center">
                    <Icon size={22} weight="bold" />
                  </div>
                  <h3 className="font-display font-black text-lg uppercase text-craie tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-craie/60 text-xs font-sans leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Footer Section D */}
      <Footer />
    </div>
  );
}
