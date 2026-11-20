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
  Users,
  CalendarCheck,
  Trophy,
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

  let navItems: { href: string; label: string; icon: any }[] = [];

  if (isAdmin) {
    navItems = [
      { href: "/admin?tab=users", label: "Utilisateurs", icon: Users },
      { href: "/admin?tab=fields", label: "Terrains à valider", icon: SoccerBall },
      { href: "/admin?tab=stats", label: "Statistiques", icon: ChartBar },
    ];
  } else if (isManager) {
    navItems = [
      { href: "/dashboard?tab=overview", label: "Statistiques", icon: ChartBar },
      { href: "/dashboard?tab=fields", label: "Mes Terrains", icon: SoccerBall },
      { href: "/dashboard?tab=bookings", label: "Réservations", icon: CalendarCheck },
      { href: "/dashboard?tab=slots", label: "Disponibilités", icon: Compass },
    ];
  } else if (isAuthenticated) {
    navItems = [
      { href: "/terrains", label: "Terrains", icon: Compass },
      { href: "/equipes", label: "Mes Équipes", icon: Users },
      { href: "/matches", label: "Mes Matchs", icon: Trophy },
      { href: "/mes-reservations", label: "Mes Réservations", icon: Ticket },
    ];
  } else {
    navItems = [
      { href: "/terrains", label: "Terrains", icon: Compass },
    ];
  }

  const isLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (path !== pathname) {
      if (path === "/terrains" && pathname.startsWith("/terrains")) return true;
      if (path === "/equipes" && pathname.startsWith("/equipes")) return true;
      if (path === "/matches" && pathname.startsWith("/matches")) return true;
      return false;
    }
    if (!query) {
      return !currentTab;
    }
    const targetTab = new URLSearchParams(query).get("tab");
    return currentTab === targetTab;
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-encre bg-nuit-pelouse shadow-brutal">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
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

        {/* Desktop Nav */}
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
                      ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
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

        {/* Right side Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
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
                      ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                      : isManager
                      ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                      : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                  )}
                >
                  {isAdmin ? "Admin" : isManager ? "Gérant" : "Joueur"}
                </span>
                <CaretDown size={12} weight="bold" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 border-2 border-encre bg-encre shadow-brutal-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-encre/50">
                    <p className="font-mono text-xs font-bold text-craie truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-craie/40 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/profil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-craie/80 hover:text-vert-projecteur hover:bg-nuit-pelouse transition-colors"
                  >
                    <User size={14} weight="bold" />
                    Mon Profil
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
            <Link
              href="/auth"
              className="flex items-center gap-1.5 border-2 border-vert-projecteur bg-vert-projecteur px-3.5 py-1.5 text-encre font-mono text-xs font-black uppercase tracking-wider shadow-brutal hover:bg-vert-projecteur/90 transition-colors"
            >
              <User size={14} weight="bold" />
              <span>Connexion</span>
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden border-2 border-encre bg-encre p-2 text-craie hover:border-vert-projecteur transition-colors cursor-pointer"
            aria-label="Menu mobile"
          >
            {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t-2 border-encre bg-encre px-4 py-3 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all",
                isLinkActive(href)
                  ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                  : "border-transparent text-craie/70 hover:text-craie hover:bg-nuit-pelouse"
              )}
            >
              <Icon size={16} weight="bold" />
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              href="/profil"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-craie/70 hover:text-craie hover:bg-nuit-pelouse border-2 border-transparent"
            >
              <User size={16} weight="bold" />
              Mon Profil
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function TopNav() {
  return (
    <Suspense>
      <TopNavContent />
    </Suspense>
  );
}
