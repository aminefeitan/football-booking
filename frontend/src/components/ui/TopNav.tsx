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
  SignIn,
  UserPlus,
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
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
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
    navItems = [];
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
    <header className="sticky top-0 z-50 border-b border-craie/10 bg-encre/85 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={isAdmin ? "/admin" : isManager ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="FootBook — Accueil"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vert-projecteur to-vert-projecteur/80 text-encre flex items-center justify-center font-black shadow-md shadow-vert-projecteur/20 group-hover:scale-105 transition-transform duration-200">
            <SoccerBall size={20} weight="fill" />
          </div>
          <span className="font-display text-2xl font-black text-craie tracking-tight uppercase">
            FOOT<span className="text-vert-projecteur">BOOK</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5 bg-encre/40 border border-craie/5 p-1 rounded-xl backdrop-blur-md" aria-label="Navigation principale">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isLinkActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                  active
                    ? isAdmin || isManager
                      ? "bg-orange-sifflet text-craie shadow-sm shadow-orange-sifflet/30 font-bold"
                      : "bg-vert-projecteur text-encre shadow-sm shadow-vert-projecteur/30 font-bold"
                    : "text-craie/70 hover:text-craie hover:bg-craie/5"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} weight={active ? "fill" : "bold"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-craie/15 bg-encre/60 hover:bg-encre/90 px-3 py-1.5 text-craie font-mono text-xs font-semibold shadow-sm hover:border-craie/30 transition-all cursor-pointer"
                aria-expanded={dropdownOpen}
                aria-label="Menu utilisateur"
              >
                <span className="w-6 h-6 rounded-full bg-vert-projecteur text-encre flex items-center justify-center font-black text-xs">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </span>
                <span className="max-w-[120px] truncate hidden sm:inline font-sans font-medium text-xs">
                  {user.firstName} {user.lastName ? `${user.lastName[0]}.` : ""}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border uppercase font-mono font-bold",
                    isAdmin
                      ? "border-orange-sifflet/40 text-orange-sifflet bg-orange-sifflet/10"
                      : isManager
                      ? "border-orange-sifflet/40 text-orange-sifflet bg-orange-sifflet/10"
                      : "border-vert-projecteur/40 text-vert-projecteur bg-vert-projecteur/10"
                  )}
                >
                  {isAdmin ? "Admin" : isManager ? "Gérant" : "Joueur"}
                </span>
                <CaretDown size={12} weight="bold" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-craie/10 bg-encre/95 backdrop-blur-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-craie/10">
                    <p className="font-sans font-semibold text-xs text-craie truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-craie/50 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/profil"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-craie/80 hover:text-vert-projecteur hover:bg-craie/5 transition-colors"
                    >
                      <User size={15} weight="bold" />
                      Mon Profil
                    </Link>

                    <div className="border-t border-craie/5 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-orange-sifflet hover:bg-orange-sifflet/10 transition-colors text-left cursor-pointer"
                    >
                      <SignOut size={15} weight="bold" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl border border-craie/15 hover:border-craie/40 hover:bg-craie/5 px-3.5 py-1.5 text-craie font-mono text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <SignIn size={14} weight="bold" />
                <span>Connexion</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-xl bg-vert-projecteur hover:bg-vert-projecteur/90 px-4 py-1.5 text-encre font-mono text-xs font-bold uppercase tracking-wider shadow-md shadow-vert-projecteur/20 transition-all"
              >
                <UserPlus size={14} weight="bold" />
                <span>Inscription</span>
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-xl border border-craie/15 bg-encre/70 p-2 text-craie hover:border-vert-projecteur/50 transition-colors cursor-pointer"
            aria-label="Menu mobile"
          >
            {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-craie/10 bg-encre/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all",
                isLinkActive(href)
                  ? "bg-vert-projecteur text-encre font-bold shadow-sm"
                  : "text-craie/70 hover:text-craie hover:bg-craie/5"
              )}
            >
              <Icon size={16} weight="bold" />
              {label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              href="/profil"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider text-craie/70 hover:text-craie hover:bg-craie/5"
            >
              <User size={16} weight="bold" />
              Mon Profil
            </Link>
          ) : (
            <div className="pt-2 border-t border-craie/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-craie/15 py-2.5 text-craie font-mono text-xs font-semibold uppercase tracking-wider hover:bg-craie/5"
              >
                <SignIn size={16} weight="bold" />
                Connexion
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-vert-projecteur py-2.5 text-encre font-mono text-xs font-black uppercase tracking-wider shadow-md shadow-vert-projecteur/20"
              >
                <UserPlus size={16} weight="bold" />
                Inscription
              </Link>
            </div>
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
