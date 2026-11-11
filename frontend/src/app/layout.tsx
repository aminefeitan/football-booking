import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/ui/BottomNav";
import { TopNav } from "@/components/ui/TopNav";

export const metadata: Metadata = {
  title: {
    default: "FootBook — Réserve ton terrain",
    template: "%s · FootBook",
  },
  description: "Réservez vos terrains de football (5 vs 5, 7 vs 7, 11 vs 11) en quelques clics.",
  keywords: ["football", "réservation", "terrain", "foot à 5", "foot à 7", "sport"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "FootBook",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B2E22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-nuit-pelouse text-craie font-body antialiased">
        <Providers>
          <TopNav />
          <main>{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
