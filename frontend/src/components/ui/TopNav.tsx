"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isManager, logout } = useAuth();

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

  const navItems = [
    { href: "/terrains", label: "Terrains", icon: Compass },
    { href: "/mes-reservations", label: "Mes Réservations", icon: Ticket },
    ...(isManager ? [{ href: "/dashboard", label: "Espace Gérant", icon: ChartBar }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-encre bg-nuit-pelouse shadow-brutal">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* 1. GAUCHE : Logo */}
        <Link
          href="/"
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
            const active = href === "/terrains" ? pathname.startsWith("/terrains") : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all",
                  active
                    ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
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
                    isManager
                      ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                      : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                  )}
                >
                  {isManager ? "Gérant" : "Joueur"}
                </span>
                <CaretDown size={12} weight="bold" />
              </button>

              {/* Dropdown Menu Utilisateur */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 border-2 border-encre bg-encre shadow-brutal-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-encre/50">
                    <p className="font-mono text-xs font-bold text-craie truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-craie/40 truncate">{user.email}</p>
                  </div>

                  {isManager && (
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-sifflet hover:bg-nuit-pelouse transition-colors"
                    >
                      <ChartBar size={14} weight="bold" />
                      Tableau de bord gérant
                    </Link>
                  )}

                  <Link
                    href="/mes-reservations"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-craie/80 hover:text-vert-projecteur hover:bg-nuit-pelouse transition-colors"
                  >
                    <Ticket size={14} weight="bold" />
                    Mes réservations
                  </Link>

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
                  isManager
                    ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                    : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                )}
              >
                {isManager ? "Gérant" : "Joueur"}
              </span>
            </div>
          )}

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/terrains" ? pathname.startsWith("/terrains") : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all w-full",
                  active
                    ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
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
