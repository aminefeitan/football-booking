"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Ticket,
  SoccerBall,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  WarningCircle,
  ArrowLeft,
  Trophy,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getFields, getFieldById, getFieldSlots } from "@/services/fields.service";
import { getMyMatches, getMatchById } from "@/services/matches.service";
import { createBooking } from "@/services/bookings.service";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDate, money } from "@/lib/format";
import type { Field, Match } from "@/lib/types";

function ReserverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramMatchId = searchParams.get("matchId") ?? "";
  const paramFieldId = searchParams.get("fieldId") ?? "";

  const [selectedMatchId, setSelectedMatchId] = useState(paramMatchId);
  const [selectedFieldId, setSelectedFieldId] = useState(paramFieldId);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Matchs créés par l'utilisateur encore PLANNED
  const { data: myMatches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["my-matches"],
    queryFn: getMyMatches,
  });

  const plannedMatches = myMatches.filter((m: Match) => m.status === "PLANNED");

  const { data: selectedMatch } = useQuery({
    queryKey: ["match", selectedMatchId],
    queryFn: () => getMatchById(selectedMatchId),
    enabled: !!selectedMatchId,
  });

  // Terrains approuvés
  const { data: fields = [], isLoading: loadingFields } = useQuery({
    queryKey: ["fields"],
    queryFn: () => getFields(),
  });

  const { data: selectedField } = useQuery({
    queryKey: ["field", selectedFieldId],
    queryFn: () => getFieldById(selectedFieldId),
    enabled: !!selectedFieldId,
  });

  // Créneaux du terrain sélectionné à la date du match
  const matchDateStr = selectedMatch?.startAt ? selectedMatch.startAt.slice(0, 10) : undefined;
  const { data: slots = [] } = useQuery({
    queryKey: ["slots", selectedFieldId, matchDateStr],
    queryFn: () => getFieldSlots(selectedFieldId, matchDateStr),
    enabled: !!selectedFieldId && !!matchDateStr,
  });

  const bookMut = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      setSuccessBookingId(booking.id);
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de la réservation.";
      setErrorMsg(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedMatchId || !selectedFieldId) return;

    bookMut.mutate({
      matchId: selectedMatchId,
      fieldId: selectedFieldId,
      notes: notes.trim() || undefined,
    });
  };

  if (successBookingId) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre max-w-md w-full p-8 shadow-brutal text-center space-y-5">
          <div className="w-16 h-16 border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur flex items-center justify-center mx-auto">
            <CheckCircle size={36} weight="fill" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase text-craie">
            Réservation <span className="text-vert-projecteur">Envoyée</span> !
          </h1>
          <p className="font-mono text-xs text-craie/60">
            Votre demande a été transmise au gérant du terrain. Elle est actuellement en attente de confirmation.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/mes-reservations"
              className="px-4 py-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:bg-vert-projecteur/90 transition-colors"
            >
              Voir mes réservations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-vert-projecteur mb-1">
            Réservation Officielle
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-craie">
            Réserver un <span className="text-vert-projecteur">Terrain</span>
          </h1>
          <p className="font-mono text-xs text-craie/60 mt-1">
            Associez un terrain disponible à l'un de vos matchs planifiés.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 border-2 border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet font-mono text-xs flex items-center gap-2">
            <WarningCircle size={18} weight="bold" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Étape 1 : Choisir le match */}
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-3">
            <div className="flex items-center gap-2 border-b border-encre/60 pb-2">
              <Trophy size={18} weight="bold" className="text-vert-projecteur" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie">
                1. Sélectionner le match à disputer
              </h2>
            </div>

            {loadingMatches ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement de vos matchs…</p>
            ) : plannedMatches.length === 0 ? (
              <div className="p-4 bg-nuit-pelouse border border-encre/60 text-center space-y-2">
                <p className="font-mono text-xs text-craie/60">
                  Vous n'avez aucun match planifié prêt pour réservation.
                </p>
                <Link
                  href="/matches"
                  className="inline-block font-mono text-xs font-bold uppercase text-vert-projecteur hover:underline"
                >
                  Organiser un match d'abord →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plannedMatches.map((m: Match) => {
                  const selected = selectedMatchId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMatchId(m.id)}
                      className={`text-left p-3.5 border-2 transition-colors cursor-pointer ${
                        selected
                          ? "border-vert-projecteur bg-vert-projecteur/15 text-craie shadow-brutal"
                          : "border-encre/60 bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                      }`}
                    >
                      <div className="font-display font-black text-lg uppercase text-craie">
                        {m.homeTeamName} vs {m.awayTeamName}
                      </div>
                      <div className="font-mono text-xs text-craie/50 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {formatDateTime(m.startAt)} · {m.durationMinutes} min
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 2 : Choisir le terrain */}
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-3">
            <div className="flex items-center gap-2 border-b border-encre/60 pb-2">
              <SoccerBall size={18} weight="bold" className="text-vert-projecteur" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie">
                2. Choisir le terrain (Terrains Approuvés)
              </h2>
            </div>

            {loadingFields ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des terrains…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fields.map((f: Field) => {
                  const selected = selectedFieldId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFieldId(f.id)}
                      className={`text-left p-3.5 border-2 transition-colors cursor-pointer ${
                        selected
                          ? "border-vert-projecteur bg-vert-projecteur/15 text-craie shadow-brutal"
                          : "border-encre/60 bg-nuit-pelouse text-craie/60 hover:text-craie hover:border-craie/40"
                      }`}
                    >
                      <div className="font-display font-black text-lg uppercase text-craie truncate">
                        {f.name}
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {f.city} · {f.fieldType}
                      </div>
                      <div className="font-mono text-xs font-bold text-vert-projecteur mt-2">
                        {money(f.pricePerHour, f.currency)} / heure
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 3 : Créneaux à la date du match & récapitulatif */}
          {selectedMatch && selectedField && (
            <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-4">
              <div className="flex items-center gap-2 border-b border-encre/60 pb-2">
                <Clock size={18} weight="bold" className="text-vert-projecteur" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie">
                  3. Disponibilité du terrain & Notes
                </h2>
              </div>

              <div className="p-3 bg-nuit-pelouse border-2 border-encre text-xs font-mono space-y-1">
                <div>
                  <span className="text-craie/50">Horaires d'ouverture :</span>{" "}
                  <span className="text-craie font-bold">{selectedField.openTime} - {selectedField.closeTime}</span>
                </div>
                <div>
                  <span className="text-craie/50">Créneau du match :</span>{" "}
                  <span className="text-vert-projecteur font-bold">{formatDateTime(selectedMatch.startAt)} ({selectedMatch.durationMinutes} min)</span>
                </div>
                <div>
                  <span className="text-craie/50">Montant total estimé :</span>{" "}
                  <span className="text-jaune-carton font-bold">
                    {money((selectedField.pricePerHour * selectedMatch.durationMinutes) / 60, selectedField.currency)}
                  </span>
                </div>
              </div>

              {slots.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-craie/60 block">
                    Grille horaire du jour ({matchDateStr}) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map((s, idx) => (
                      <span
                        key={idx}
                        className={`font-mono text-[10px] px-2 py-0.5 border ${
                          s.status === "available"
                            ? "border-vert-projecteur/40 text-vert-projecteur bg-vert-projecteur/10"
                            : "border-craie/20 text-craie/30 bg-encre"
                        }`}
                      >
                        {s.time} ({s.status === "available" ? "libre" : "occupé"})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase text-craie/60 block">
                  Remarques ou consignes pour le gérant (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: besoin de chasubles, ballon fourni…"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={bookMut.isPending}
                  className="w-full sm:w-auto shadow-brutal"
                >
                  Envoyer la demande de réservation
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function ReserverPage() {
  return (
    <ProtectedRoute allowedRoles={["PLAYER"]}>
      <Suspense>
        <ReserverContent />
      </Suspense>
    </ProtectedRoute>
  );
}
