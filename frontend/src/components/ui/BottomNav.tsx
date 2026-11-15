"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  House,
  MagnifyingGlass,
  Ticket,
  ChartBar,
  User,
  SoccerBall,
  Users,
  CalendarCheck,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { isAuthenticated, isManager, isAdmin } = useAuth();

  let navItems: { href: string; icon: any; label: string }[] = [];

  if (isAdmin) {
    navItems = [
      { href: "/admin?tab=users", icon: Users, label: "Users" },
      { href: "/admin?tab=fields", icon: SoccerBall, label: "Terrains" },
      { href: "/admin?tab=bookings", icon: Ticket, label: "Résas" },
      { href: "/auth", icon: User, label: "Profil" },
    ];
  } else if (isManager) {
    navItems = [
      { href: "/dashboard?tab=overview", icon: ChartBar, label: "Dashboard" },
      { href: "/dashboard?tab=fields", icon: SoccerBall, label: "Terrains" },
      { href: "/dashboard?tab=bookings", icon: CalendarCheck, label: "Résas" },
      { href: "/dashboard?tab=matches", icon: SoccerBall, label: "Matchs" },
      { href: "/dashboard?tab=teams", icon: Users, label: "Équipes" },
    ];
  } else if (isAuthenticated) {
    // JOUEUR CONNECTÉ UNIQUEMENT
    navItems = [
      { href: "/terrains", icon: MagnifyingGlass, label: "Terrains" },
      { href: "/matches", icon: SoccerBall, label: "Matchs" },
      { href: "/equipes", icon: Users, label: "Équipes" },
      { href: "/mes-reservations", icon: Ticket, label: "Résa" },
      { href: "/profil", icon: User, label: "Profil" },
    ];
  } else {
    // UTILISATEUR NON AUTHENTIFIÉ : Pas de "Terrains" dans la barre de navigation
    navItems = [
      { href: "/", icon: House, label: "Accueil" },
      { href: "/auth", icon: User, label: "Connexion" },
    ];
  }

  const isLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (path !== pathname) {
      if (path === "/terrains" && pathname.startsWith("/terrains")) return true;
      return false;
    }
    if (!query) return !currentTab;
    const targetTab = new URLSearchParams(query).get("tab");
    if (currentTab === targetTab) return true;
    if (!currentTab) {
      if (path === "/admin" && targetTab === "users") return true;
      if (path === "/dashboard" && targetTab === "overview") return true;
    }
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-encre bg-nuit-pelouse md:hidden"
      aria-label="Navigation mobile"
    >
      <div className="flex items-stretch h-14">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isLinkActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                active
                  ? isAdmin
                    ? "text-jaune-carton bg-encre/60"
                    : isManager
                    ? "text-orange-sifflet bg-encre/60"
                    : "text-vert-projecteur bg-encre/40"
                  : "text-craie/40 hover:text-craie/70"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              <span className="font-mono font-bold" style={{ fontSize: "9px", letterSpacing: "0.08em" }}>
                {label.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<nav className="fixed bottom-0 left-0 right-0 h-14 border-t-2 border-encre bg-nuit-pelouse md:hidden" />}>
      <BottomNavContent />
    </Suspense>
  );
}
