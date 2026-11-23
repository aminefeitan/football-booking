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
  Trophy,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getFields, getFieldById, getFieldSlots } from "@/services/fields.service";
import { getMyMatches, getMatchById } from "@/services/matches.service";
import { createBooking } from "@/services/bookings.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
        <div className="rounded-3xl border border-vert-projecteur/30 bg-encre/95 backdrop-blur-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full border border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur flex items-center justify-center mx-auto shadow-lg shadow-vert-projecteur/20">
            <CheckCircle size={44} weight="fill" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-black text-3xl uppercase text-craie">
              Réservation <span className="text-vert-projecteur">Transmise</span> !
            </h1>
            <p className="text-xs font-sans text-craie/70 leading-relaxed">
              Votre demande a été envoyée au gérant du terrain. Vous recevrez une confirmation dès validation de votre créneau.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/mes-reservations"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-vert-projecteur text-encre font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-vert-projecteur/20 hover:bg-vert-projecteur/90 transition-all"
            >
              <span>Accéder à mes réservations</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vert-projecteur bg-vert-projecteur/10 px-3 py-1 rounded-full border border-vert-projecteur/20">
            Processus de Réservation
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
            Réserver un <span className="text-vert-projecteur">Terrain</span>
          </h1>
          <p className="font-sans text-sm text-craie/70">
            Associez un complexe sportif disponible à l'un de vos matchs planifiés.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl border border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet font-mono text-xs flex items-center gap-3">
            <WarningCircle size={20} weight="bold" />
            <span className="font-sans text-sm">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Étape 1 : Choisir le match */}
          <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-craie/10 pb-3">
              <Trophy size={20} weight="bold" className="text-vert-projecteur" />
              <h2 className="font-display font-black text-xl uppercase tracking-wide text-craie">
                1. Sélectionner le match à disputer
              </h2>
            </div>

            {loadingMatches ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement de vos matchs…</p>
            ) : plannedMatches.length === 0 ? (
              <div className="p-6 rounded-2xl bg-nuit-pelouse/60 border border-craie/10 text-center space-y-3">
                <p className="font-sans text-sm text-craie/70">
                  Vous n'avez aucun match planifié prêt pour réservation.
                </p>
                <Link
                  href="/matches"
                  className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-vert-projecteur hover:underline"
                >
                  Organiser un match d'abord →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {plannedMatches.map((m: Match) => {
                  const selected = selectedMatchId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMatchId(m.id)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        selected
                          ? "border-vert-projecteur bg-vert-projecteur/15 text-craie shadow-lg shadow-vert-projecteur/10"
                          : "border-craie/10 bg-nuit-pelouse/40 text-craie/70 hover:border-craie/30"
                      }`}
                    >
                      <div className="font-display font-black text-lg uppercase text-craie">
                        {m.homeTeamName} <span className="text-orange-sifflet text-sm">VS</span> {m.awayTeamName}
                      </div>
                      <div className="font-mono text-xs text-craie/50 mt-1 flex items-center gap-2">
                        <Calendar size={14} className="text-vert-projecteur" />
                        <span>{formatDateTime(m.startAt)} · {m.durationMinutes} min</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 2 : Choisir le terrain */}
          <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-craie/10 pb-3">
              <SoccerBall size={20} weight="bold" className="text-vert-projecteur" />
              <h2 className="font-display font-black text-xl uppercase tracking-wide text-craie">
                2. Choisir le terrain
              </h2>
            </div>

            {loadingFields ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des terrains…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {fields.map((f: Field) => {
                  const selected = selectedFieldId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFieldId(f.id)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        selected
                          ? "border-vert-projecteur bg-vert-projecteur/15 text-craie shadow-lg shadow-vert-projecteur/10"
                          : "border-craie/10 bg-nuit-pelouse/40 text-craie/70 hover:border-craie/30"
                      }`}
                    >
                      <div className="font-display font-black text-base uppercase text-craie truncate">
                        {f.name}
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-vert-projecteur" />
                        <span>{f.city} · {f.fieldType}</span>
                      </div>
                      <div className="font-mono text-xs font-bold text-vert-projecteur mt-2">
                        {money(f.pricePerHour, f.currency)} / h
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 3 : Récapitulatif & Notes */}
          {selectedMatch && selectedField && (
            <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-craie/10 pb-3">
                <Clock size={20} weight="bold" className="text-vert-projecteur" />
                <h2 className="font-display font-black text-xl uppercase tracking-wide text-craie">
                  3. Récapitulatif & Instructions
                </h2>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-nuit-pelouse/80 border border-craie/10 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-craie/50">Terrain :</span>
                  <span className="font-bold text-craie">{selectedField.name} ({selectedField.city})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-craie/50">Créneau du match :</span>
                  <span className="text-vert-projecteur font-bold">{formatDateTime(selectedMatch.startAt)} ({selectedMatch.durationMinutes} min)</span>
                </div>
                <div className="flex justify-between border-t border-craie/10 pt-2 text-sm">
                  <span className="text-craie/70 font-semibold">Montant total estimé :</span>
                  <span className="text-jaune-carton font-black">
                    {money((selectedField.pricePerHour * selectedMatch.durationMinutes) / 60, selectedField.currency)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-craie/60 block">
                  Remarques ou consignes pour le gérant (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex : Besoin de chasubles, ballons fournis…"
                  className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-vert-projecteur resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="booking"
                  size="lg"
                  loading={bookMut.isPending}
                  className="w-full sm:w-auto shadow-lg shadow-vert-projecteur/25"
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
