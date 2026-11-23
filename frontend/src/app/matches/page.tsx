"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  WarningCircle,
  XCircle,
  Ticket,
  MagnifyingGlass,
  ArrowRight,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getMyMatches, createMatch, cancelMatch } from "@/services/matches.service";
import { getMyTeams, searchTeams } from "@/services/teams.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, toCasablancaIso } from "@/lib/format";
import type { Match, Team, TeamSummary } from "@/lib/types";

export default function MatchesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Form states
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamSearch, setAwayTeamSearch] = useState("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<TeamSummary | null>(null);
  const [datetimeLocal, setDatetimeLocal] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [durationMinutes, setDurationMinutes] = useState(90);

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["my-matches"],
    queryFn: getMyMatches,
  });

  const { data: myTeams = [] } = useQuery({
    queryKey: ["my-teams"],
    queryFn: getMyTeams,
  });

  const captainTeams = myTeams.filter((t: Team) =>
    t.members?.some((m) => m.role === "CAPTAIN" && m.userId === user?.id)
  );

  const { data: searchedAwayTeams = [] } = useQuery({
    queryKey: ["search-teams", awayTeamSearch],
    queryFn: () => searchTeams(awayTeamSearch.trim()),
    enabled: awayTeamSearch.trim().length >= 1,
  });

  const createMut = useMutation({
    mutationFn: createMatch,
    onSuccess: (newMatch) => {
      qc.invalidateQueries({ queryKey: ["my-matches"] });
      setShowModal(false);
      setHomeTeamId("");
      setSelectedAwayTeam(null);
      setAwayTeamSearch("");
      setFeedback({ text: "Match organisé avec succès ! Vous pouvez maintenant lui réserver un terrain." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du match";
      setFeedback({ text: msg, error: true });
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelMatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-matches"] });
      setFeedback({ text: "Match et réservation annulés avec succès." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur annulation match";
      setFeedback({ text: msg, error: true });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !selectedAwayTeam) return;

    if (homeTeamId === selectedAwayTeam.id) {
      setFeedback({ text: "L'équipe adverse doit être différente de votre équipe.", error: true });
      return;
    }

    createMut.mutate({
      homeTeamId,
      awayTeamId: selectedAwayTeam.id,
      startAt: toCasablancaIso(datetimeLocal),
      durationMinutes: Number(durationMinutes),
    });
  };

  return (
    <ProtectedRoute allowedRoles={["PLAYER"]}>
      <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vert-projecteur bg-vert-projecteur/10 px-3 py-1 rounded-full border border-vert-projecteur/20">
                Confrontations & Calendrier
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
                Mes <span className="text-vert-projecteur">Matchs</span>
              </h1>
            </div>
            <Button
              variant="booking"
              size="md"
              onClick={() => {
                if (captainTeams.length === 0) {
                  setFeedback({
                    text: "Vous devez être capitaine d'au moins une équipe pour organiser un match.",
                    error: true,
                  });
                  return;
                }
                setHomeTeamId(captainTeams[0].id);
                setShowModal(true);
              }}
              className="shadow-lg shadow-vert-projecteur/20 shrink-0"
            >
              <Plus size={16} weight="bold" />
              Organiser un match
            </Button>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-3 backdrop-blur-md ${
                feedback.error
                  ? "border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet"
                  : "border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur"
              }`}
            >
              {feedback.error ? <WarningCircle size={20} weight="bold" /> : <CheckCircle size={20} weight="bold" />}
              <span className="font-sans text-sm">{feedback.text}</span>
            </div>
          )}

          {/* Liste des matchs */}
          {loadingMatches ? (
            <div className="text-center py-16 font-mono text-sm text-craie/40 animate-pulse">
              Chargement de vos matchs…
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-craie/20 p-16 text-center bg-encre/40 space-y-4">
              <Trophy size={48} className="mx-auto text-craie/30" />
              <p className="font-mono text-sm text-craie/70 font-semibold">
                Aucun match planifié pour vos équipes.
              </p>
              <p className="font-sans text-xs text-craie/40">
                En tant que capitaine, organisez un match face à un club adverse !
              </p>
              {captainTeams.length > 0 && (
                <Button variant="secondary" onClick={() => setShowModal(true)}>
                  Organiser un match
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((m: Match) => {
                const isCreator = m.creatorId === user?.id;
                const isPlanned = m.status === "PLANNED";

                return (
                  <div
                    key={m.id}
                    className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 flex flex-col justify-between space-y-5 hover:border-vert-projecteur/40 transition-all shadow-xl shadow-black/20"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <Badge
                          variant={
                            m.status === "PLANNED"
                              ? "confirmed"
                              : m.status === "FINISHED"
                              ? "default"
                              : "cancelled"
                          }
                        >
                          {m.status === "PLANNED" ? "Prévu" : m.status === "FINISHED" ? "Terminé" : "Annulé"}
                        </Badge>
                        <span className="font-mono text-xs text-craie/50 flex items-center gap-1.5 bg-craie/5 px-2.5 py-0.5 rounded-full">
                          <Clock size={14} /> {m.durationMinutes} min
                        </span>
                      </div>

                      {/* Stadium Arena Card */}
                      <div className="rounded-2xl bg-nuit-pelouse/80 border border-craie/10 p-5 text-center space-y-3 relative overflow-hidden">
                        <div className="font-display font-black text-2xl uppercase text-craie">
                          {m.homeTeamName}
                        </div>
                        <div className="inline-block px-3 py-0.5 rounded-full bg-orange-sifflet/15 border border-orange-sifflet/30 font-mono text-xs font-bold text-orange-sifflet">
                          VS
                        </div>
                        <div className="font-display font-black text-2xl uppercase text-craie">
                          {m.awayTeamName}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 font-mono text-xs text-craie/70">
                        <Calendar size={16} className="text-vert-projecteur" />
                        <span>{formatDateTime(m.startAt)}</span>
                      </div>
                    </div>

                    <div className="border-t border-craie/10 pt-4 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href={`/matches/${m.id}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-craie/60 hover:text-craie"
                      >
                        <span>Détails match</span>
                        <ArrowRight size={14} />
                      </Link>

                      <div className="flex items-center gap-2">
                        {isPlanned && isCreator && (
                          <>
                            <Link
                              href={`/reserver?matchId=${m.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-vert-projecteur text-encre font-mono text-xs font-black uppercase tracking-wider shadow-md shadow-vert-projecteur/20 hover:bg-vert-projecteur/90 transition-all"
                            >
                              <Ticket size={14} weight="bold" />
                              <span>Réserver terrain</span>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelMut.mutate(m.id)}
                              loading={cancelMut.isPending}
                              className="text-orange-sifflet hover:bg-orange-sifflet/10"
                            >
                              Annuler
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Créer Match */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="rounded-3xl border border-craie/15 bg-encre/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full space-y-5">
              <div className="flex items-center justify-between border-b border-craie/10 pb-3">
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  Organiser un <span className="text-vert-projecteur">Match</span>
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-craie/10 text-craie/60 hover:text-craie flex items-center justify-center font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase text-craie/60 block">
                    Mon équipe (Domicile - Vous êtes capitaine)
                  </label>
                  <select
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-vert-projecteur"
                  >
                    {captainTeams.map((t: Team) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase text-craie/60 block">
                    Équipe adverse
                  </label>
                  {selectedAwayTeam ? (
                    <div className="flex items-center justify-between rounded-xl border border-vert-projecteur/40 bg-vert-projecteur/10 px-3.5 py-2.5 text-sm text-craie">
                      <span className="font-mono font-bold">{selectedAwayTeam.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAwayTeam(null)}
                        className="text-orange-sifflet font-mono text-xs uppercase hover:underline"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse px-3.5 py-2 focus-within:border-vert-projecteur">
                        <MagnifyingGlass size={16} className="text-craie/40 mr-2" />
                        <input
                          type="text"
                          value={awayTeamSearch}
                          onChange={(e) => setAwayTeamSearch(e.target.value)}
                          placeholder="Rechercher une équipe adverse…"
                          className="w-full bg-transparent text-craie text-sm outline-none"
                        />
                      </div>
                      {searchedAwayTeams.length > 0 && (
                        <div className="rounded-xl border border-craie/15 bg-nuit-pelouse max-h-36 overflow-y-auto divide-y divide-craie/10">
                          {searchedAwayTeams
                            .filter((t: TeamSummary) => t.id !== homeTeamId)
                            .map((t: TeamSummary) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAwayTeam(t);
                                  setAwayTeamSearch("");
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-mono text-craie hover:bg-vert-projecteur hover:text-encre cursor-pointer"
                              >
                                {t.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Date et heure</label>
                    <input
                      type="datetime-local"
                      value={datetimeLocal}
                      onChange={(e) => setDatetimeLocal(e.target.value)}
                      required
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-vert-projecteur"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Durée</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-vert-projecteur"
                    >
                      <option value={60}>60 minutes (1h)</option>
                      <option value={90}>90 minutes (1h30)</option>
                      <option value={120}>120 minutes (2h)</option>
                      <option value={180}>180 minutes (3h)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-craie/10">
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="booking"
                    disabled={!selectedAwayTeam}
                    loading={createMut.isPending}
                  >
                    Valider le match
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
