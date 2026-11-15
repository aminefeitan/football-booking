"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  MapPin,
  Crown,
  ArrowLeft,
  CheckCircle,
  SignOut,
  UserPlus,
  Shield,
  Trash,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import {
  getTeamById,
  removeTeamMember,
  invitePlayerToTeam,
} from "@/services/teams.service";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [inviteUserId, setInviteUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["team", id],
    queryFn: () => getTeamById(id),
  });

  const inviteMut = useMutation({
    mutationFn: () => invitePlayerToTeam(id, inviteUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", id] });
      setInviteUserId("");
      setFeedback("Invitation envoyée avec succès !");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const removeMemberMut = useMutation({
    mutationFn: (targetUserId: string) => removeTeamMember(id, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", id] });
      setFeedback("Membre retiré de l'équipe.");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
            Chargement de l&apos;équipe...
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal max-w-md">
          <h2 className="font-display font-black text-2xl text-craie uppercase mb-3">
            Équipe introuvable
          </h2>
          <p className="font-mono text-xs text-craie/60 mb-6">
            Cette équipe n&apos;existe pas ou a été dissoute.
          </p>
          <Link
            href="/equipes"
            className="inline-flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-bold uppercase"
          >
            <ArrowLeft size={14} weight="bold" /> Retour aux équipes
          </Link>
        </div>
      </div>
    );
  }

  const members = team.members ?? [];
  const max = team.maxMembers ?? 15;
  const isFull = members.length >= max;
  const isCaptain = user && team.creator?.id === user.id;
  const isMember = user && members.some((m) => m.user?.id === user.id);

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation retour */}
        <Link
          href="/equipes"
          className="inline-flex items-center gap-2 font-mono text-xs text-craie/60 hover:text-vert-projecteur uppercase tracking-wider mb-6 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" /> Retour à la liste des équipes
        </Link>

        {feedback && (
          <div className="mb-6 p-4 border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur font-mono font-bold text-sm shadow-brutal flex items-center gap-2">
            <CheckCircle size={20} weight="bold" />
            {feedback}
          </div>
        )}

        {/* Fiche Équipe */}
        <div className="border-2 border-encre bg-encre shadow-brutal-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-encre/40 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1.5 font-mono text-xs text-vert-projecteur font-bold">
                  <MapPin size={14} weight="bold" />
                  <span>{team.city ?? "France"}</span>
                </span>
                <span className="font-mono text-xs text-craie/50">
                  {members.length} / {max} membres
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-craie uppercase">
                {team.name}
              </h1>
            </div>

            {isMember && !isCaptain && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user && removeMemberMut.mutate(user.id)}
                loading={removeMemberMut.isPending}
                className="text-rouge-carton hover:bg-rouge-carton/10"
              >
                Quitter l&apos;équipe
              </Button>
            )}
          </div>

          {team.description && (
            <div className="mb-6 p-4 border border-encre/40 bg-nuit-pelouse text-craie/80 text-sm font-body">
              {team.description}
            </div>
          )}

          {/* Invitation form (capitaine) */}
          {isCaptain && !isFull && (
            <div className="border-2 border-vert-projecteur bg-vert-projecteur/5 p-4 mb-6">
              <div className="font-mono text-xs font-bold text-vert-projecteur uppercase mb-2">
                Inviter un joueur par son ID utilisateur
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID UUID du joueur (ex: 550e8400-e29b-...)"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  className="bg-nuit-pelouse border-2 border-encre text-craie px-3 py-1.5 font-mono text-xs flex-1 focus:border-vert-projecteur focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!inviteUserId.trim()}
                  onClick={() => inviteMut.mutate()}
                  loading={inviteMut.isPending}
                  icon={<UserPlus size={16} weight="bold" />}
                >
                  Inviter
                </Button>
              </div>
            </div>
          )}

          {/* Effectif de l'équipe */}
          <div className="pt-2">
            <h2 className="font-display font-black text-xl text-craie uppercase mb-4 flex items-center gap-2">
              <Users size={20} className="text-vert-projecteur" />
              Effectif Officiel ({members.length})
            </h2>

            {members.length === 0 ? (
              <p className="font-mono text-xs text-craie/40 italic py-4 text-center border border-encre/40 bg-nuit-pelouse">
                Aucun joueur enregistré dans cette équipe.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const memberCaptain = m.role === "CAPTAIN" || m.user?.id === team.creator?.id;

                  return (
                    <div
                      key={m.id}
                      className="border-2 border-encre bg-nuit-pelouse p-3 flex items-center justify-between gap-4 font-mono text-xs shadow-brutal"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 border border-encre flex items-center justify-center font-black ${
                            memberCaptain
                              ? "bg-jaune-carton text-encre"
                              : "bg-vert-projecteur/20 text-vert-projecteur"
                          }`}
                        >
                          {memberCaptain ? <Crown size={16} weight="fill" /> : <Shield size={16} />}
                        </div>
                        <div>
                          <div className="text-craie font-bold">
                            {m.user ? `${m.user.firstName} ${m.user.lastName}` : "Membre"}
                          </div>
                          <div className="text-[10px] text-craie/50">
                            {m.position ?? m.user?.preferredPosition ?? "Polyvalent"} •{" "}
                            {memberCaptain ? "Capitaine" : "Joueur"}
                          </div>
                        </div>
                      </div>

                      {isCaptain && m.user?.id !== user?.id && (
                        <button
                          onClick={() => m.user?.id && removeMemberMut.mutate(m.user.id)}
                          className="p-1.5 border border-rouge-carton/40 text-rouge-carton hover:bg-rouge-carton/20 transition-colors"
                          title="Retirer du club"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
