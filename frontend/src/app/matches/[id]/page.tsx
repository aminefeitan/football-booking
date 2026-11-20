"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Clock,
  Ticket,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getMatchById, cancelMatch } from "@/services/matches.service";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDate } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default function MatchDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();

  const { data: match, isLoading, error } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatchById(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelMatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <p className="font-mono text-sm text-vert-projecteur animate-pulse">Chargement du match…</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex flex-col items-center justify-center gap-3">
        <div className="font-display text-craie/20 text-7xl">404</div>
        <p className="font-mono text-sm text-craie/60">Match introuvable ou non autorisé.</p>
        <Button variant="ghost" onClick={() => router.push("/matches")}>
          Retour à mes matchs
        </Button>
      </div>
    );
  }

  const isCreator = match.creatorId === user?.id;
  const isPlanned = match.status === "PLANNED";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nuit-pelouse pb-20">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <button
            onClick={() => router.push("/matches")}
            className="flex items-center gap-1.5 text-craie/50 hover:text-craie font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} weight="bold" /> Mes matchs
          </button>

          <div className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-6">
            <div className="flex items-center justify-between border-b border-encre/60 pb-3">
              <span
                className={`font-mono text-xs px-2.5 py-1 border font-bold uppercase ${
                  match.status === "PLANNED"
                    ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                    : match.status === "FINISHED"
                    ? "border-craie/40 text-craie/40 bg-craie/5"
                    : "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                }`}
              >
                {match.status === "PLANNED" ? "Prévu" : match.status === "FINISHED" ? "Terminé" : "Annulé"}
              </span>
              <span className="font-mono text-xs text-craie/40">
                Organisé le {formatDate(match.createdAt)}
              </span>
            </div>

            {/* Confrontation */}
            <div className="bg-nuit-pelouse border-2 border-encre p-6 text-center space-y-3">
              <div className="font-display font-black text-3xl uppercase text-craie">
                {match.homeTeamName}
              </div>
              <div className="font-mono text-sm font-bold uppercase text-orange-sifflet tracking-widest">
                VS
              </div>
              <div className="font-display font-black text-3xl uppercase text-craie">
                {match.awayTeamName}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-encre/60 pt-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-craie/40 uppercase block">Horaire de début</span>
                <span className="text-craie font-bold flex items-center gap-1.5">
                  <Calendar size={14} className="text-vert-projecteur" />
                  {formatDateTime(match.startAt)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-craie/40 uppercase block">Durée</span>
                <span className="text-craie font-bold flex items-center gap-1.5">
                  <Clock size={14} className="text-vert-projecteur" />
                  {match.durationMinutes} minutes
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-craie/40 uppercase block">Organisateur</span>
                <span className="text-craie">{match.creatorName || "Joueur"}</span>
              </div>
            </div>

            {isPlanned && (isCreator || isAdmin) && (
              <div className="border-t border-encre/60 pt-4 flex flex-wrap items-center justify-between gap-3">
                {isCreator && (
                  <Link
                    href={`/reserver?matchId=${match.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre font-mono text-xs font-black uppercase tracking-wider shadow-brutal hover:bg-vert-projecteur/90 transition-colors"
                  >
                    <Ticket size={16} weight="bold" />
                    Réserver un terrain
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={() => cancelMut.mutate()}
                  loading={cancelMut.isPending}
                  className="text-orange-sifflet hover:bg-orange-sifflet/10 ml-auto"
                >
                  Annuler le match
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
