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
      <div className="min-h-screen bg-nuit-pelouse pb-20">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-vert-projecteur mb-1">
                Espace Compétition
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-craie">
                Mes <span className="text-vert-projecteur">Équipes</span>
              </h1>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="shadow-brutal shrink-0"
            >
              <Plus size={16} weight="bold" />
              Créer une équipe
            </Button>
          </div>

          {feedback && (
            <div
              className={`p-3 border-2 font-mono text-xs flex items-center gap-2 ${
                feedback.error
                  ? "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet"
                  : "border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur"
              }`}
            >
              {feedback.error ? <WarningCircle size={16} /> : <CheckCircle size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Section Invitations Reçues */}
          {invitations.length > 0 && (
            <div className="border-2 border-orange-sifflet bg-orange-sifflet/10 p-5 shadow-brutal space-y-3">
              <div className="flex items-center gap-2">
                <EnvelopeSimple size={20} weight="bold" className="text-orange-sifflet" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-craie">
                  Invitations Reçues ({invitations.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invitations.map((inv: TeamInvitation) => (
                  <div
                    key={inv.id}
                    className="border-2 border-encre bg-encre p-4 flex items-center justify-between gap-3 shadow-brutal"
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
            <div className="text-center py-12 font-mono text-sm text-craie/40 animate-pulse">
              Chargement de vos équipes…
            </div>
          ) : teams.length === 0 ? (
            <div className="border-2 border-dashed border-craie/20 p-12 text-center bg-encre/40 space-y-3">
              <Users size={48} className="mx-auto text-craie/30" />
              <p className="font-mono text-sm text-craie/70 font-semibold">
                Vous ne faites partie d'aucune équipe pour le moment.
              </p>
              <p className="font-mono text-xs text-craie/40">
                Créez votre équipe pour inviter vos amis et organiser des matchs !
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
                    className="border-2 border-encre bg-encre shadow-brutal p-5 flex flex-col justify-between space-y-4 hover:border-vert-projecteur transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 border border-vert-projecteur/40 text-vert-projecteur bg-vert-projecteur/10 font-bold uppercase">
                          {isCaptain ? "Capitaine" : "Membre"}
                        </span>
                        <span className="font-mono text-xs text-craie/40">
                          {t.members?.length ?? 1} / 15 joueurs
                        </span>
                      </div>
                      <h3 className="font-display font-black text-2xl uppercase text-craie truncate">
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="font-body text-xs text-craie/60 line-clamp-2 mt-1">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-encre/60 pt-3 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-craie/40">
                        Créée le {formatDate(t.createdAt)}
                      </span>
                      <Link
                        href={`/equipes/${t.id}`}
                        className="font-mono text-xs font-bold uppercase text-vert-projecteur hover:underline"
                      >
                        Gérer l'équipe →
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
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="border-2 border-encre bg-encre p-6 shadow-brutal max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-encre/60 pb-3">
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  Créer une <span className="text-vert-projecteur">Équipe</span>
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-craie/60 hover:text-craie font-mono text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Nom de l'équipe</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Atlas Lions"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Description (optionnelle)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Présentation, devise, créneaux préférés…"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" loading={createMut.isPending}>
                    Créer (Capitaine)
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
