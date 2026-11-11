"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MagnifyingGlass, Ticket, ChartBar, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",                  icon: House,            label: "Accueil"      },
  { href: "/terrains",          icon: MagnifyingGlass,  label: "Terrains"     },
  { href: "/mes-reservations",  icon: Ticket,           label: "Résa"         },
  { href: "/dashboard",         icon: ChartBar,         label: "Dashboard"    },
  { href: "/auth",              icon: User,             label: "Profil"       },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-encre bg-nuit-pelouse md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch h-14">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "text-vert-projecteur bg-encre/40" : "text-craie/40 hover:text-craie/70"
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
