import { EnvelopeSimple, Phone, ShieldCheck, SoccerBall } from "@phosphor-icons/react";
import Link from "next/link";

export function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL?.trim();
  const contactPhone = process.env.NEXT_PUBLIC_ADMIN_CONTACT_PHONE?.trim();

  return (
    <footer className="w-full border-t border-craie/10 bg-encre/60 backdrop-blur-xl py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-vert-projecteur text-encre flex items-center justify-center font-black">
              <SoccerBall size={16} weight="fill" />
            </div>
            <span className="font-display text-xl font-black text-craie tracking-tight uppercase">
              FOOT<span className="text-vert-projecteur">BOOK</span>
            </span>
          </div>
          <p className="text-xs text-craie/60 leading-relaxed font-sans">
            La plateforme sportive de référence pour réserver vos terrains et gérer vos matchs en toute simplicité.
          </p>
        </div>

        {(contactEmail || contactPhone) && (
          <div className="rounded-2xl border border-craie/10 bg-encre/40 p-4 space-y-2 backdrop-blur-md">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-vert-projecteur">
              Espace Propriétaires & Gérants
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-craie/80">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 hover:text-vert-projecteur transition-colors"
                >
                  <EnvelopeSimple size={14} weight="bold" />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-1.5 hover:text-vert-projecteur transition-colors"
                >
                  <Phone size={14} weight="bold" />
                  {contactPhone}
                </a>
              )}
            </div>
          </div>
        )}

        <div className="text-xs font-mono text-craie/40 space-y-1">
          <p>© {new Date().getFullYear()} FootBook SaaS. Tous droits réservés.</p>
          <p className="text-[11px] text-craie/30">Conçu pour les clubs & passionnés de football</p>
        </div>
      </div>
    </footer>
  );
}
