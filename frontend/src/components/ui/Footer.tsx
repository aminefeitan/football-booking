import { EnvelopeSimple, Phone } from "@phosphor-icons/react";

export function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL?.trim();
  const contactPhone = process.env.NEXT_PUBLIC_ADMIN_CONTACT_PHONE?.trim();

  if (!contactEmail && !contactPhone) {
    return (
      <footer className="w-full border-t border-encre/30 py-6 text-center text-xs font-mono text-craie/40">
        © {new Date().getFullYear()} FootBook · Tous droits réservés
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-encre/40 bg-encre/30 py-8 px-4 text-center">
      <div className="max-w-xl mx-auto space-y-3">
        <p className="font-display uppercase text-sm tracking-wide text-vert-projecteur font-bold">
          Envie de devenir gérant de terrain ? Contactez l&apos;administrateur
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-craie/70">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-1.5 hover:text-vert-projecteur transition-colors underline underline-offset-4"
            >
              <EnvelopeSimple size={14} weight="bold" />
              {contactEmail}
            </a>
          )}
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="inline-flex items-center gap-1.5 hover:text-vert-projecteur transition-colors underline underline-offset-4"
            >
              <Phone size={14} weight="bold" />
              {contactPhone}
            </a>
          )}
        </div>
        <p className="text-[11px] font-mono text-craie/30 pt-2">
          © {new Date().getFullYear()} FootBook · Plateforme de réservation
        </p>
      </div>
    </footer>
  );
}
