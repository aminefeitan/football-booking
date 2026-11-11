"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlass, Ticket, ChartBar, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/terrains",          label: "Terrains"       },
  { href: "/mes-reservations",  label: "Réservations"   },
  { href: "/dashboard",         label: "Dashboard"      },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-encre bg-nuit-pelouse/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-black text-vert-projecteur uppercase leading-none shrink-0 hover:text-craie transition-colors"
          aria-label="FootBook — Accueil"
        >
          Foot<span className="text-orange-sifflet">Book</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5" aria-label="Navigation principale">
          {navItems.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors font-mono",
                  active ? "text-vert-projecteur" : "text-craie/50 hover:text-craie"
                )}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth CTA */}
        <Link
          href="/auth"
          className="hidden md:flex items-center gap-1.5 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-3 py-1.5 font-bold text-xs uppercase tracking-widest hover:bg-transparent hover:text-vert-projecteur transition-colors"
          aria-label="Connexion"
        >
          <User size={13} weight="bold" />
          Connexion
        </Link>
      </div>
    </header>
  );
}
