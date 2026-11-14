"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SoccerBall,
  User,
  List,
  X,
  Ticket,
  ChartBar,
  Compass,
  SignOut,
  CaretDown,
  ShieldCheck,
  Users,
  CalendarCheck,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function TopNavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const { user, isAuthenticated, isManager, isAdmin, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  // ── Navigation dynamique selon le rôle ──────────────────────────────────────
  let navItems: { href: string; label: string; icon: any }[] = [];

  if (isAdmin) {
    // ADMIN : ses fonctionnalités directement dans le navbar (aucun catalogue public "Terrains")
    navItems = [
      { href: "/admin?tab=users", label: "Utilisateurs", icon: Users },
      { href: "/admin?tab=fields", label: "Terrains (Admin)", icon: SoccerBall },
      { href: "/admin?tab=bookings", label: "Réservations & Litiges", icon: Ticket },
    ];
  } else if (isManager) {
    // GÉRANT : ses fonctionnalités directement dans le navbar (aucun catalogue public "Terrains")
    navItems = [
      { href: "/dashboard?tab=overview", label: "Tableau de bord", icon: ChartBar },
      { href: "/dashboard?tab=fields", label: "Mes Terrains", icon: SoccerBall },
      { href: "/dashboard?tab=bookings", label: "Réservations", icon: CalendarCheck },
    ];
  } else if (isAuthenticated) {
    // JOUEUR CONNECTÉ UNIQUEMENT
    navItems = [
      { href: "/terrains", label: "Terrains", icon: Compass },
      { href: "/mes-reservations", label: "Mes Réservations", icon: Ticket },
    ];
  } else {
    // UTILISATEUR NON AUTHENTIFIÉ : Pas de lien "Terrains" dans le navbar
    navItems = [];
  }

  const isLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (path !== pathname) {
      if (path === "/terrains" && pathname.startsWith("/terrains")) return true;
      return false;
    }
    if (!query) {
      return !currentTab;
    }
    const targetTab = new URLSearchParams(query).get("tab");
    if (currentTab === targetTab) return true;
    if (!currentTab) {
      if (path === "/admin" && targetTab === "users") return true;
      if (path === "/dashboard" && targetTab === "overview") return true;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-encre bg-nuit-pelouse shadow-brutal">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* 1. GAUCHE : Logo */}
        <Link
          href={isAdmin ? "/admin" : isManager ? "/dashboard" : "/"}
          className="flex items-center gap-2 group shrink-0"
          aria-label="FootBook — Accueil"
        >
          <div className="w-8 h-8 border-2 border-encre bg-vert-projecteur text-encre flex items-center justify-center font-black shadow-brutal group-hover:bg-orange-sifflet group-hover:text-craie transition-colors">
            <SoccerBall size={18} weight="fill" />
          </div>
          <span className="font-display text-2xl font-black text-craie tracking-tight uppercase">
            FOOT<span className="text-vert-projecteur">BOOK</span>
          </span>
        </Link>

        {/* 2. CENTRE : Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isLinkActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all",
                  active
                    ? isAdmin
                      ? "border-jaune-carton bg-jaune-carton text-encre shadow-brutal"
                      : isManager
                      ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
                      : "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                    : "border-transparent text-craie/70 hover:text-craie hover:border-encre hover:bg-encre/40"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={14} weight={active ? "fill" : "bold"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 3. DROITE : État Connecté vs Connexion */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            /* Utilisateur connecté : Badge Nom + Menu Profil */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 border-2 border-encre bg-encre px-3 py-1.5 text-craie font-mono text-xs font-bold shadow-brutal hover:border-vert-projecteur transition-colors cursor-pointer"
                aria-expanded={dropdownOpen}
                aria-label="Menu utilisateur"
              >
                <span className="w-6 h-6 border border-encre bg-vert-projecteur text-encre flex items-center justify-center font-black text-xs">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </span>
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {user.firstName} {user.lastName ? `${user.lastName[0]}.` : ""}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1 py-0.2 border uppercase",
                    isAdmin
                      ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                      : isManager
                      ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                      : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                  )}
                >
                  {isAdmin ? "Admin" : isManager ? "Gérant" : "Joueur"}
                </span>
                <CaretDown size={12} weight="bold" />
              </button>

              {/* Dropdown Menu Utilisateur */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 border-2 border-encre bg-encre shadow-brutal-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-encre/50">
                    <p className="font-mono text-xs font-bold text-craie truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-craie/40 truncate">{user.email}</p>
                  </div>

                  {/* Options ADMIN */}
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin?tab=users"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-jaune-carton hover:bg-nuit-pelouse transition-colors"
                      >
                        <Users size={14} weight="bold" />
                        Gestion Utilisateurs
                      </Link>
                      <Link
                        href="/admin?tab=fields"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-jaune-carton hover:bg-nuit-pelouse transition-colors"
                      >
                        <SoccerBall size={14} weight="bold" />
                        Gestion Terrains
                      </Link>
                      <Link
                        href="/admin?tab=bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-jaune-carton hover:bg-nuit-pelouse transition-colors"
                      >
                        <Ticket size={14} weight="bold" />
                        Historique & Litiges
                      </Link>
                    </>
                  )}

                  {/* Options GÉRANT */}
                  {isManager && (
                    <>
                      <Link
                        href="/dashboard?tab=overview"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-sifflet hover:bg-nuit-pelouse transition-colors"
                      >
                        <ChartBar size={14} weight="bold" />
                        Tableau de bord
                      </Link>
                      <Link
                        href="/dashboard?tab=fields"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-sifflet hover:bg-nuit-pelouse transition-colors"
                      >
                        <SoccerBall size={14} weight="bold" />
                        Mes Terrains
                      </Link>
                      <Link
                        href="/dashboard?tab=bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-sifflet hover:bg-nuit-pelouse transition-colors"
                      >
                        <CalendarCheck size={14} weight="bold" />
                        Réservations & Planning
                      </Link>
                    </>
                  )}

                  {/* Options JOUEUR */}
                  {!isAdmin && !isManager && (
                    <Link
                      href="/mes-reservations"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-craie/80 hover:text-vert-projecteur hover:bg-nuit-pelouse transition-colors"
                    >
                      <Ticket size={14} weight="bold" />
                      Mes réservations
                    </Link>
                  )}

                  <Link
                    href="/auth"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-craie/80 hover:text-vert-projecteur hover:bg-nuit-pelouse transition-colors"
                  >
                    <User size={14} weight="bold" />
                    Mon profil
                  </Link>

                  <div className="border-t border-encre/50 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-sifflet hover:bg-orange-sifflet/10 transition-colors text-left cursor-pointer"
                  >
                    <SignOut size={14} weight="bold" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Non connecté : Bouton Connexion */
            <Link
              href="/auth"
              className="flex items-center gap-1.5 border-2 border-encre bg-vert-projecteur text-encre px-3.5 py-1.5 font-mono text-xs font-black uppercase tracking-wider shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors"
              aria-label="Connexion"
            >
              <User size={14} weight="bold" />
              <span>Connexion</span>
            </Link>
          )}

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden border-2 border-encre bg-encre text-craie p-1.5 shadow-brutal hover:text-vert-projecteur transition-colors"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-encre bg-encre px-4 py-4 space-y-2">
          {isAuthenticated && user && (
            <div className="p-3 border-2 border-vert-projecteur bg-vert-projecteur/10 mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold text-craie">
                  {user.firstName} {user.lastName}
                </p>
                <p className="font-mono text-[10px] text-craie/50">{user.email}</p>
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 border font-mono font-bold uppercase",
                  isAdmin
                    ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                    : isManager
                    ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                    : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                )}
              >
                {isAdmin ? "Admin" : isManager ? "Gérant" : "Joueur"}
              </span>
            </div>
          )}

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isLinkActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all w-full",
                  active
                    ? isAdmin
                      ? "border-jaune-carton bg-jaune-carton text-encre shadow-brutal"
                      : isManager
                      ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
                      : "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                    : "border-craie/20 text-craie/80 hover:text-craie hover:border-vert-projecteur"
                )}
              >
                <Icon size={16} weight="bold" />
                {label}
              </Link>
            );
          })}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 border-2 border-orange-sifflet text-orange-sifflet hover:bg-orange-sifflet hover:text-craie px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider w-full mt-2 transition-colors cursor-pointer"
            >
              <SignOut size={16} weight="bold" />
              Se déconnecter
            </button>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-3 py-2.5 font-mono text-xs font-black uppercase tracking-wider shadow-brutal w-full mt-2"
            >
              <User size={16} weight="bold" />
              Connexion / Inscription
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function TopNav() {
  return (
    <Suspense fallback={<header className="h-14 border-b-2 border-encre bg-nuit-pelouse" />}>
      <TopNavContent />
    </Suspense>
  );
}
