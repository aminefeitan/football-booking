"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Crown,
  Plus,
  CheckCircle,
  XCircle,
  EnvelopeSimple,
  WarningCircle,
  Trophy,
  ArrowRight,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import {
  getMyTeams,
  createTeam,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/services/teams.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Team, TeamInvitation } from "@/lib/types";

export default function TeamsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: getMyTeams,
  });

  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: getMyInvitations,
  });

  const createMut = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams"] });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setFeedback({ text: "Équipe créée avec succès !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur création équipe";
      setFeedback({ text: msg, error: true });
    },
  });

  const acceptMut = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-invitations"] });
      qc.invalidateQueries({ queryKey: ["my-teams"] });
      setFeedback({ text: "Invitation acceptée !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur acceptation";
      setFeedback({ text: msg, error: true });
    },
  });

  const declineMut = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-invitations"] });
      setFeedback({ text: "Invitation refusée." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur refus";
      setFeedback({ text: msg, error: true });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
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
                Espace Compétition
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
                Mes <span className="text-vert-projecteur">Équipes</span>
              </h1>
            </div>
            <Button
              variant="booking"
              size="md"
              onClick={() => setShowCreateModal(true)}
              className="shadow-lg shadow-vert-projecteur/20 shrink-0"
            >
              <Plus size={16} weight="bold" />
              Créer une équipe
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

          {/* Section Invitations Reçues */}
          {invitations.length > 0 && (
            <div className="rounded-3xl border border-orange-sifflet/40 bg-orange-sifflet/10 backdrop-blur-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5">
                <EnvelopeSimple size={22} weight="bold" className="text-orange-sifflet" />
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-craie">
                  Invitations Reçues ({invitations.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {invitations.map((inv: TeamInvitation) => (
                  <div
                    key={inv.id}
                    className="rounded-2xl border border-craie/10 bg-encre/90 p-4 flex items-center justify-between gap-4 shadow-lg"
                  >
                    <div>
                      <div className="font-display font-black text-lg uppercase text-craie">
                        {inv.teamName}
                      </div>
                      <div className="font-mono text-xs text-craie/50">
                        Invité par {inv.invitedByName || "le capitaine"} · {formatDate(inv.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => acceptMut.mutate(inv.id)}
                        loading={acceptMut.isPending}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => declineMut.mutate(inv.id)}
                        loading={declineMut.isPending}
                        className="text-orange-sifflet hover:bg-orange-sifflet/20"
                      >
                        Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des Équipes */}
          {loadingTeams ? (
            <div className="text-center py-16 font-mono text-sm text-craie/40 animate-pulse">
              Chargement de vos équipes…
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-craie/20 p-16 text-center bg-encre/40 space-y-4">
              <Users size={48} className="mx-auto text-craie/30" />
              <p className="font-mono text-sm text-craie/70 font-semibold">
                Vous ne faites partie d'aucune équipe pour le moment.
              </p>
              <p className="font-sans text-xs text-craie/40 max-w-sm mx-auto">
                Créez votre club dès maintenant pour inviter vos amis et organiser vos premières confrontations.
              </p>
              <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
                Créer une équipe
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((t: Team) => {
                const captainMember = t.members?.find((m) => m.role === "CAPTAIN");
                const isCaptain = captainMember?.userId === user?.id;

                return (
                  <div
                    key={t.id}
                    className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 flex flex-col justify-between space-y-5 hover:border-vert-projecteur/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/20"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={isCaptain ? "confirmed" : "default"}>
                          {isCaptain ? "Capitaine" : "Membre"}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-craie/50 bg-craie/5 px-2.5 py-1 rounded-full border border-craie/5">
                          {t.members?.length ?? 1} / 15 joueurs
                        </span>
                      </div>
                      <h3 className="font-display font-black text-2xl uppercase text-craie truncate">
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="font-sans text-xs text-craie/60 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-craie/10 pt-4 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-craie/40">
                        Créée le {formatDate(t.createdAt)}
                      </span>
                      <Link
                        href={`/equipes/${t.id}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-vert-projecteur hover:underline"
                      >
                        <span>Gérer l'équipe</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Création */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="rounded-3xl border border-craie/15 bg-encre/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-5">
              <div className="flex items-center justify-between border-b border-craie/10 pb-3">
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  Créer une <span className="text-vert-projecteur">Équipe</span>
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-craie/10 text-craie/60 hover:text-craie flex items-center justify-center font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Nom de l'équipe</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Atlas Lions FC"
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Description (optionnelle)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Présentation, devise, créneaux préférés…"
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-vert-projecteur resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-craie/10">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="booking" loading={createMut.isPending}>
                    Créer l'équipe (Capitaine)
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
