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
import { Badge } from "@/components/ui/Badge";
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
      <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <button
            onClick={() => router.push("/matches")}
            className="inline-flex items-center gap-2 text-craie/50 hover:text-craie font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Mes matchs</span>
          </button>

          <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-craie/10 pb-4">
              <Badge
                variant={
                  match.status === "PLANNED"
                    ? "confirmed"
                    : match.status === "FINISHED"
                    ? "default"
                    : "cancelled"
                }
              >
                {match.status === "PLANNED" ? "Prévu" : match.status === "FINISHED" ? "Terminé" : "Annulé"}
              </Badge>
              <span className="font-mono text-xs text-craie/40">
                Organisé le {formatDate(match.createdAt)}
              </span>
            </div>

            {/* Stadium Arena Card */}
            <div className="rounded-2xl bg-nuit-pelouse/90 border border-craie/10 p-6 text-center space-y-3">
              <div className="font-display font-black text-3xl uppercase text-craie">
                {match.homeTeamName}
              </div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-orange-sifflet/15 border border-orange-sifflet/30 font-mono text-xs font-bold text-orange-sifflet">
                VS
              </div>
              <div className="font-display font-black text-3xl uppercase text-craie">
                {match.awayTeamName}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-craie/10 pt-4 font-mono text-xs">
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
              <div className="border-t border-craie/10 pt-4 flex flex-wrap items-center justify-between gap-3">
                {isCreator && (
                  <Link
                    href={`/reserver?matchId=${match.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vert-projecteur text-encre font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-vert-projecteur/20 hover:bg-vert-projecteur/90 transition-all"
                  >
                    <Ticket size={16} weight="bold" />
                    <span>Réserver un terrain</span>
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
