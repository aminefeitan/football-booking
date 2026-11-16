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
  MagnifyingGlass,
  Warning,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import {
  getTeamById,
  removeTeamMember,
  invitePlayerToTeam,
} from "@/services/teams.service";
import { searchPlayers } from "@/services/players.service";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [searchName, setSearchName] = useState("");
  const [invitingPlayerId, setInvitingPlayerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["team", id],
    queryFn: () => getTeamById(id),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players", searchName],
    queryFn: () => searchPlayers(searchName.trim() || undefined),
    enabled: Boolean(user),
  });

  const inviteMut = useMutation({
    mutationFn: ({ userId, name }: { userId?: string; name?: string }) => {
      if (userId) {
        return invitePlayerToTeam(id, { invitedUserId: userId });
      }
      return invitePlayerToTeam(id, { playerName: name });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["team", id] });
      setSearchName("");
      setInvitingPlayerId(null);
      setErrorMessage(null);
      const targetLabel = variables.name ? ` à ${variables.name}` : "";
      setFeedback(`Invitation envoyée avec succès${targetLabel} !`);
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: unknown) => {
      setInvitingPlayerId(null);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
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
  const memberUserIds = new Set(members.map((m) => m.user?.id).filter(Boolean));

  const matchingPlayers = allPlayers.filter((p) => {
    if (!p) return false;
    if (!searchName.trim()) return false;
    const q = searchName.toLowerCase().trim();
    const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
    const reverseName = `${p.lastName ?? ""} ${p.firstName ?? ""}`.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    return fullName.includes(q) || reverseName.includes(q) || email.includes(q);
  });

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
            <div className="border-2 border-vert-projecteur bg-vert-projecteur/5 p-5 mb-8 shadow-brutal space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="font-mono text-xs font-bold text-vert-projecteur uppercase flex items-center gap-2">
                  <UserPlus size={18} weight="bold" />
                  Inviter un joueur par son nom et prénom
                </div>
                <span className="font-mono text-[11px] text-craie/40">
                  Recherche dans l&apos;annuaire des joueurs
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 border-2 border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet font-mono text-xs flex items-center gap-2">
                  <Warning size={16} weight="bold" />
                  {errorMessage}
                </div>
              )}

              {/* Champ de recherche */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlass
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-craie/40 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Tapez le prénom ou nom du joueur (ex: Amine Rachidi)..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchName.trim()) {
                          e.preventDefault();
                          const match = matchingPlayers[0];
                          if (match) {
                            setInvitingPlayerId(match.id);
                            inviteMut.mutate({ userId: match.id, name: `${match.firstName} ${match.lastName}` });
                          } else {
                            inviteMut.mutate({ name: searchName.trim() });
                          }
                        }
                      }}
                      className="w-full bg-nuit-pelouse border-2 border-encre text-craie pl-9 pr-8 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                    />
                    {searchName && (
                      <button
                        onClick={() => setSearchName("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-craie/40 hover:text-craie"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!searchName.trim()}
                    onClick={() => {
                      const match = matchingPlayers[0];
                      if (match) {
                        setInvitingPlayerId(match.id);
                        inviteMut.mutate({ userId: match.id, name: `${match.firstName} ${match.lastName}` });
                      } else {
                        inviteMut.mutate({ name: searchName.trim() });
                      }
                    }}
                    loading={inviteMut.isPending && !invitingPlayerId}
                    icon={<UserPlus size={16} weight="bold" />}
                  >
                    Inviter
                  </Button>
                </div>

                {/* Suggestions / Résultats de recherche */}
                {searchName.trim().length > 0 && (
                  <div className="mt-3 border-2 border-encre bg-encre shadow-brutal max-h-64 overflow-y-auto divide-y divide-encre/60">
                    {matchingPlayers.length === 0 ? (
                      <div className="p-4 text-center font-mono text-xs text-craie/50">
                        Aucun joueur trouvé pour &quot;{searchName}&quot;.
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => inviteMut.mutate({ name: searchName.trim() })}
                            disabled={inviteMut.isPending}
                            className="text-vert-projecteur underline hover:text-vert-projecteur/80 text-[11px] cursor-pointer"
                          >
                            Tenter d&apos;inviter directement par ce nom
                          </button>
                        </div>
                      </div>
                    ) : (
                      matchingPlayers.map((p) => {
                        const isAlreadyMember = memberUserIds.has(p.id);
                        const isCurrentCaptain = p.id === user?.id;
                        const isInvitingThis = invitingPlayerId === p.id && inviteMut.isPending;

                        return (
                          <div
                            key={p.id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-nuit-pelouse/60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-encre bg-nuit-pelouse flex items-center justify-center font-mono font-bold text-xs text-vert-projecteur">
                                {(p.firstName?.[0] ?? "").toUpperCase()}
                                {(p.lastName?.[0] ?? "").toUpperCase()}
                              </div>
                              <div>
                                <div className="text-craie font-bold text-xs font-mono">
                                  {p.firstName} {p.lastName}
                                </div>
                                <div className="text-[11px] font-mono text-craie/50">
                                  {p.preferredPosition ?? "Polyvalent"} • {p.city ?? "Ville non renseignée"}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isCurrentCaptain ? (
                                <span className="font-mono text-[10px] text-jaune-carton border border-jaune-carton/40 px-2 py-0.5">
                                  Capitaine (Vous)
                                </span>
                              ) : isAlreadyMember ? (
                                <span className="font-mono text-[10px] text-craie/40 border border-encre px-2 py-0.5">
                                  Déjà membre
                                </span>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={isInvitingThis}
                                  disabled={inviteMut.isPending}
                                  onClick={() => {
                                    setInvitingPlayerId(p.id);
                                    inviteMut.mutate({
                                      userId: p.id,
                                      name: `${p.firstName} ${p.lastName}`,
                                    });
                                  }}
                                  icon={<UserPlus size={14} weight="bold" />}
                                  className="text-[11px] py-1 px-3"
                                >
                                  Inviter
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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
