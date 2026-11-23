"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Crown,
  UserPlus,
  Trash,
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import {
  getTeamById,
  inviteMember,
  removeMember,
} from "@/services/teams.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { TeamMember } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [inviteEmail, setInviteEmail] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["team", id],
    queryFn: () => getTeamById(id),
  });

  const inviteMut = useMutation({
    mutationFn: (email: string) => inviteMember(id, email),
    onSuccess: () => {
      setInviteEmail("");
      setFeedback({ text: "Invitation envoyée avec succès !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation";
      setFeedback({ text: msg, error: true });
    },
  });

  const removeMut = useMutation({
    mutationFn: (targetUserId: string) => removeMember(id, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", id] });
      setFeedback({ text: "Membre retiré de l'équipe." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'exclusion";
      setFeedback({ text: msg, error: true });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <p className="font-mono text-sm text-vert-projecteur animate-pulse">Chargement de l'équipe…</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex flex-col items-center justify-center gap-3">
        <div className="font-display text-craie/20 text-7xl">404</div>
        <p className="font-mono text-sm text-craie/60">Équipe introuvable ou vous n'en êtes pas membre.</p>
        <Button variant="ghost" onClick={() => router.push("/equipes")}>
          Retour à mes équipes
        </Button>
      </div>
    );
  }

  const isCaptain = team.members?.some((m) => m.role === "CAPTAIN" && m.userId === user?.id);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMut.mutate(inviteEmail.trim());
  };

  return (
    <ProtectedRoute allowedRoles={["PLAYER"]}>
      <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <button
            onClick={() => router.push("/equipes")}
            className="inline-flex items-center gap-2 text-craie/50 hover:text-craie font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Mes équipes</span>
          </button>

          {/* En-tête équipe */}
          <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Badge variant={isCaptain ? "confirmed" : "default"}>
                  {isCaptain ? "Vous êtes Capitaine" : "Membre de l'équipe"}
                </Badge>
                <span className="font-mono text-xs text-craie/40">
                  Créée le {formatDate(team.createdAt)}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase text-craie">
                {team.name}
              </h1>
              {team.description && (
                <p className="font-sans text-sm text-craie/65">{team.description}</p>
              )}
            </div>

            <div className="rounded-2xl border border-craie/10 p-4 bg-nuit-pelouse/80 shrink-0 text-center font-mono text-xs text-craie/60">
              <span className="font-display font-black text-3xl text-vert-projecteur block">
                {team.members?.length ?? 1} / 15
              </span>
              Effectif actuel
            </div>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-2.5 backdrop-blur-md ${
                feedback.error
                  ? "border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet"
                  : "border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur"
              }`}
            >
              {feedback.error ? <WarningCircle size={18} /> : <CheckCircle size={18} />}
              <span className="font-sans text-sm">{feedback.text}</span>
            </div>
          )}

          {/* Section Capitaine : Inviter un joueur */}
          {isCaptain && (
            <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-craie/10 pb-3">
                <UserPlus size={20} weight="bold" className="text-vert-projecteur" />
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-craie">
                  Inviter un coéquipier par email
                </h2>
              </div>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coequipier@exemple.com"
                  required
                  className="flex-1 rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-4 py-2.5 text-sm outline-none focus:border-vert-projecteur"
                />
                <Button type="submit" variant="booking" loading={inviteMut.isPending} className="shrink-0">
                  Envoyer l'invitation
                </Button>
              </form>
            </div>
          )}

          {/* Liste des membres */}
          <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl overflow-hidden shadow-xl divide-y divide-craie/5">
            <div className="p-5 bg-encre/90 border-b border-craie/10 flex items-center justify-between">
              <h2 className="font-display font-black text-lg uppercase tracking-wider text-craie">
                Effectif du Club ({team.members?.length ?? 0})
              </h2>
            </div>

            {team.members?.map((m: TeamMember) => {
              const isMemberCaptain = m.role === "CAPTAIN";

              return (
                <div key={m.userId} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-craie/5 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full border border-craie/15 bg-nuit-pelouse flex items-center justify-center font-display font-black text-sm text-vert-projecteur">
                      {m.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-craie">
                          {m.firstName} {m.lastName}
                        </span>
                        {isMemberCaptain ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-jaune-carton bg-jaune-carton/10 border border-jaune-carton/30 px-2 py-0.5 rounded-full font-bold uppercase">
                            <Crown size={12} weight="fill" /> Capitaine
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-craie/40 uppercase">Membre</span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-craie/40 mt-0.5">
                        {m.email} {m.phone ? `· ${m.phone}` : ""} · Inscription le {formatDate(m.joinedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Bouton exclure (réservé au capitaine) */}
                  {isCaptain && !isMemberCaptain && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMut.mutate(m.userId)}
                      loading={removeMut.isPending}
                      className="text-orange-sifflet hover:bg-orange-sifflet/10"
                      title="Exclure ce membre"
                    >
                      <Trash size={16} />
                      <span className="hidden sm:inline">Exclure</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
