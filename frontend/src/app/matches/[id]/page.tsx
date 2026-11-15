"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SoccerBall,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  SignOut,
  UserPlus,
  Shield,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getMatchById, joinMatch, leaveMatch, cancelMatch } from "@/services/matches.service";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [selectedSide, setSelectedSide] = useState<"A" | "B">("A");
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: match, isLoading, error } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatchById(id),
  });

  const joinMut = useMutation({
    mutationFn: () => joinMatch(id, selectedSide),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match", id] });
      setFeedback("Vous avez rejoint la partie !");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveMatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match", id] });
      setFeedback("Vous avez quitté la partie.");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelMatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match", id] });
      setFeedback("Le match a été annulé.");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
            Chargement du match...
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal max-w-md">
          <h2 className="font-display font-black text-2xl text-craie uppercase mb-3">
            Match introuvable
          </h2>
          <p className="font-mono text-xs text-craie/60 mb-6">
            Ce match n&apos;existe pas ou a été supprimé.
          </p>
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-bold uppercase"
          >
            <ArrowLeft size={14} weight="bold" /> Retour aux matchs
          </Link>
        </div>
      </div>
    );
  }

  const participants = match.participants ?? [];
  const max = match.maxPlayers ?? 10;
  const isFull = participants.length >= max;
  const currentParticipant = user ? participants.find((p) => p.user?.id === user.id) : undefined;
  const isOrganizer = user && match.organizer?.id === user.id;

  const teamA = participants.filter((p) => p.teamSide === "A");
  const teamB = participants.filter((p) => p.teamSide === "B");
  const unassigned = participants.filter((p) => p.teamSide !== "A" && p.teamSide !== "B");

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation retour */}
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 font-mono text-xs text-craie/60 hover:text-vert-projecteur uppercase tracking-wider mb-6 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" /> Retour à la liste des matchs
        </Link>

        {feedback && (
          <div className="mb-6 p-4 border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur font-mono font-bold text-sm shadow-brutal flex items-center gap-2">
            <CheckCircle size={20} weight="bold" />
            {feedback}
          </div>
        )}

        {/* Card principale */}
        <div className="border-2 border-encre bg-encre shadow-brutal-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-encre/40 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-xs font-mono font-bold uppercase px-2.5 py-1 border ${
                    match.status === "OPEN" && !isFull
                      ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                      : isFull
                      ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                      : "border-craie/40 text-craie/60 bg-craie/5"
                  }`}
                >
                  {isFull ? "COMPLET" : match.status === "OPEN" ? "OUVERT AUX INSCRIPTIONS" : match.status}
                </span>
                <span className="font-mono text-xs text-craie/50">
                  Organisé par {match.organizer ? `${match.organizer.firstName} ${match.organizer.lastName}` : "Anonyme"}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-craie uppercase">
                {match.title}
              </h1>
            </div>

            {/* Actions organisateur */}
            {isOrganizer && match.status === "OPEN" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelMut.mutate()}
                loading={cancelMut.isPending}
                className="text-rouge-carton hover:bg-rouge-carton/10"
              >
                Annuler le match
              </Button>
            )}
          </div>

          {match.description && (
            <div className="mb-6 p-4 border border-encre/40 bg-nuit-pelouse text-craie/80 text-sm font-body">
              {match.description}
            </div>
          )}

          {/* Grille informations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-craie mb-8">
            <div className="border-2 border-encre bg-nuit-pelouse p-4">
              <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                <Calendar size={16} /> Date
              </div>
              <div className="font-bold text-sm">{formatDate(match.matchDate)}</div>
              <div className="text-craie/50">
                {new Date(match.matchDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="border-2 border-encre bg-nuit-pelouse p-4">
              <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                <Clock size={16} /> Durée & Format
              </div>
              <div className="font-bold text-sm">{match.durationMinutes} minutes</div>
              <div className="text-craie/50">{participants.length} / {max} joueurs</div>
            </div>

            <div className="border-2 border-encre bg-nuit-pelouse p-4">
              <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                <MapPin size={16} /> Lieu
              </div>
              <div className="font-bold text-sm">
                {match.field?.name ?? match.city ?? "Terrain libre"}
              </div>
              <div className="text-craie/50">{match.field?.city ?? match.city}</div>
            </div>
          </div>

          {/* Actions Rejoindre / Quitter */}
          <div className="border-t-2 border-encre/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isAuthenticated ? (
              currentParticipant ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-vert-projecteur font-mono text-xs font-bold">
                    <CheckCircle size={18} weight="bold" />
                    <span>Tu participes à ce match ({currentParticipant.teamSide ? `Équipe ${currentParticipant.teamSide}` : "Non assigné"})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leaveMut.mutate()}
                    loading={leaveMut.isPending}
                    icon={<SignOut size={16} weight="bold" />}
                  >
                    Se désinscrire
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-craie/70 uppercase">Équipe :</span>
                    <button
                      onClick={() => setSelectedSide("A")}
                      className={`px-3 py-1 font-mono text-xs font-bold border-2 transition-colors ${
                        selectedSide === "A"
                          ? "border-vert-projecteur bg-vert-projecteur text-encre"
                          : "border-encre bg-nuit-pelouse text-craie"
                      }`}
                    >
                      Équipe A
                    </button>
                    <button
                      onClick={() => setSelectedSide("B")}
                      className={`px-3 py-1 font-mono text-xs font-bold border-2 transition-colors ${
                        selectedSide === "B"
                          ? "border-orange-sifflet bg-orange-sifflet text-craie"
                          : "border-encre bg-nuit-pelouse text-craie"
                      }`}
                    >
                      Équipe B
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    disabled={isFull || match.status !== "OPEN"}
                    onClick={() => joinMut.mutate()}
                    loading={joinMut.isPending}
                    className="w-full sm:w-auto ml-auto"
                    icon={<UserPlus size={16} weight="bold" />}
                  >
                    {isFull ? "Match Complet" : "Rejoindre la partie"}
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs text-craie/60">
                  Connecte-toi pour participer à ce match
                </span>
                <Link
                  href={`/auth?redirect=/matches/${id}`}
                  className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Composition des équipes */}
        <h2 className="font-display font-black text-2xl text-craie uppercase mb-4 flex items-center gap-2">
          <Users size={24} className="text-vert-projecteur" />
          Composition des équipes ({participants.length}/{max})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Équipe A */}
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between border-b-2 border-vert-projecteur pb-3 mb-4">
              <span className="font-display font-black text-lg text-vert-projecteur uppercase">
                Équipe A
              </span>
              <span className="font-mono text-xs text-vert-projecteur font-bold">
                {teamA.length} joueurs
              </span>
            </div>

            {teamA.length === 0 ? (
              <p className="font-mono text-xs text-craie/40 italic py-4 text-center">
                Aucun joueur dans l&apos;équipe A
              </p>
            ) : (
              <ul className="space-y-2">
                {teamA.map((p, idx) => (
                  <li
                    key={p.id || idx}
                    className="flex items-center justify-between p-2 border border-encre/40 bg-nuit-pelouse font-mono text-xs"
                  >
                    <span className="text-craie font-bold">
                      {p.user ? `${p.user.firstName} ${p.user.lastName}` : "Joueur"}
                    </span>
                    <span className="text-craie/50 text-[10px]">
                      {p.user?.preferredPosition ?? "Joueur"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Équipe B */}
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between border-b-2 border-orange-sifflet pb-3 mb-4">
              <span className="font-display font-black text-lg text-orange-sifflet uppercase">
                Équipe B
              </span>
              <span className="font-mono text-xs text-orange-sifflet font-bold">
                {teamB.length} joueurs
              </span>
            </div>

            {teamB.length === 0 ? (
              <p className="font-mono text-xs text-craie/40 italic py-4 text-center">
                Aucun joueur dans l&apos;équipe B
              </p>
            ) : (
              <ul className="space-y-2">
                {teamB.map((p, idx) => (
                  <li
                    key={p.id || idx}
                    className="flex items-center justify-between p-2 border border-encre/40 bg-nuit-pelouse font-mono text-xs"
                  >
                    <span className="text-craie font-bold">
                      {p.user ? `${p.user.firstName} ${p.user.lastName}` : "Joueur"}
                    </span>
                    <span className="text-craie/50 text-[10px]">
                      {p.user?.preferredPosition ?? "Joueur"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Joueurs sans côté */}
        {unassigned.length > 0 && (
          <div className="mt-6 border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="font-mono text-xs font-bold text-craie/70 uppercase mb-3">
              En attente d&apos;attribution d&apos;équipe ({unassigned.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p, idx) => (
                <span
                  key={p.id || idx}
                  className="px-3 py-1.5 border border-encre bg-nuit-pelouse font-mono text-xs text-craie"
                >
                  {p.user ? `${p.user.firstName} ${p.user.lastName}` : "Joueur"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
