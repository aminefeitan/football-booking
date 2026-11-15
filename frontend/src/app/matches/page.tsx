"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  SoccerBall,
  MapPin,
  Calendar,
  Clock,
  Users,
  Plus,
  Lock,
  X,
  CheckCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getMatches, createMatch, joinMatch } from "@/services/matches.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Match } from "@/lib/types";

export default function MatchesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [cityFilter, setCityFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [matchDate, setMatchDate] = useState(
    new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [city, setCity] = useState("Khenifra");
  const [isPublic, setIsPublic] = useState(true);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", cityFilter],
    queryFn: () => getMatches(cityFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createMatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setModalError(null);
      setFeedbackMsg("Match organisé avec succès !");
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du match";
      setModalError(msg);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (matchId: string) => joinMatch(matchId, "A"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      setFeedbackMsg("Vous avez rejoint le match !");
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      title,
      description,
      matchDate: new Date(matchDate).toISOString(),
      durationMinutes: Number(durationMinutes),
      maxPlayers: Number(maxPlayers),
      city,
      isPublic,
    });
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div
              aria-hidden="true"
              className="font-display font-black text-vert-projecteur/10 text-[60px] leading-none select-none -mb-2"
            >
              MATCHS
            </div>
            <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
              Parties Amicales
            </h1>
            <p className="font-mono text-xs text-craie/60 uppercase tracking-widest mt-2">
              Trouve des joueurs et organise des rencontres ouvertes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} weight="bold" />}
              >
                Organiser un match
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => router.push("/auth?redirect=/matches")}
                icon={<Lock size={16} weight="bold" />}
              >
                Connexion pour organiser
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mb-6 p-4 border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur font-mono font-bold text-sm shadow-brutal flex items-center gap-2">
            <CheckCircle size={20} weight="bold" />
            {feedbackMsg}
          </div>
        )}

        {/* Filters */}
        <div className="border-2 border-encre bg-encre p-4 shadow-brutal mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-mono text-xs font-bold text-craie/60 uppercase">Ville :</span>
            <input
              type="text"
              placeholder="Toutes les villes (ex: Paris)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-nuit-pelouse border-2 border-encre text-craie px-3 py-1.5 text-xs font-mono focus:border-vert-projecteur focus:outline-none w-full sm:w-60"
            />
            {cityFilter && (
              <button
                onClick={() => setCityFilter("")}
                className="text-xs text-craie/50 hover:text-craie font-mono"
              >
                Effacer
              </button>
            )}
          </div>
          <div className="font-mono text-xs text-vert-projecteur font-bold">
            {matches.length} {matches.length > 1 ? "matchs disponibles" : "match disponible"}
          </div>
        </div>

        {/* Matches Grid */}
        {isLoading ? (
          <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal">
            <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest animate-pulse">
              Recherche des matchs en cours...
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal">
            <SoccerBall size={48} className="mx-auto text-craie/30 mb-4" />
            <div className="font-display font-black text-xl text-craie uppercase mb-2">
              Aucun match trouvé
            </div>
            <p className="font-mono text-xs text-craie/50 max-w-md mx-auto mb-6">
              Aucun match ouvert ne correspond à vos critères. Sois le premier à organiser une partie !
            </p>
            {isAuthenticated && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Créer un match maintenant
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((m) => {
              const participantCount = m.participants?.length ?? 0;
              const max = m.maxPlayers ?? 10;
              const isFull = participantCount >= max;
              const isJoined = user && m.participants?.some((p) => p.user?.id === user.id);

              return (
                <div
                  key={m.id}
                  className="border-2 border-encre bg-encre shadow-brutal hover:shadow-brutal-xl transition-shadow flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Top status */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${
                          m.status === "OPEN" && !isFull
                            ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                            : isFull
                            ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                            : "border-craie/40 text-craie/60 bg-craie/5"
                        }`}
                      >
                        {isFull ? "COMPLET" : m.status === "OPEN" ? "OUVERT" : m.status}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs text-craie/60">
                        <Users size={14} weight="bold" />
                        <span>
                          {participantCount} / {max}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display font-black text-xl text-craie uppercase mb-2 line-clamp-1">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="font-body text-xs text-craie/70 mb-4 line-clamp-2">
                        {m.description}
                      </p>
                    )}

                    <div className="space-y-1.5 font-mono text-xs text-craie/80 mb-4 border-t border-encre/40 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-vert-projecteur" />
                        <span>{formatDate(m.matchDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-vert-projecteur" />
                        <span>
                          {new Date(m.matchDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({m.durationMinutes} min)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-vert-projecteur" />
                        <span>{m.field?.name ?? m.city ?? "Terrain à définir"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t-2 border-nuit-pelouse flex gap-2">
                    <Link
                      href={`/matches/${m.id}`}
                      className="flex-1 text-center border-2 border-encre bg-nuit-pelouse text-craie hover:text-vert-projecteur px-3 py-2 font-mono text-xs font-bold uppercase transition-colors"
                    >
                      Détails
                    </Link>

                    {isAuthenticated && !isJoined && !isFull && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => joinMutation.mutate(m.id)}
                        loading={joinMutation.isPending}
                      >
                        Rejoindre
                      </Button>
                    )}

                    {isJoined && (
                      <span className="border-2 border-vert-projecteur text-vert-projecteur px-3 py-1.5 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                        Inscrit ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre/80 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg border-2 border-encre bg-encre p-6 shadow-brutal-xl relative max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b-2 border-encre/50 mb-4">
                  <div className="font-display font-black text-2xl text-craie uppercase">
                    Organiser <span className="text-vert-projecteur">un match</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setModalError(null);
                    }}
                    className="p-1 border border-craie/30 text-craie/60 hover:text-craie"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                {modalError && (
                  <div className="mb-4 p-3 border-2 border-rouge-carton bg-rouge-carton/15 text-rouge-carton font-mono font-bold text-xs shadow-brutal">
                    ⚠ {modalError}
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                      Titre du match *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 5v5 Amical du Vendredi"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-sm focus:border-vert-projecteur focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Niveau souhaité, règles, ambiance..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                        Date & Heure *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={matchDate}
                        onChange={(e) => setMatchDate(e.target.value)}
                        className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                        Durée (minutes)
                      </label>
                      <input
                        type="number"
                        min={30}
                        max={180}
                        step={15}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                        Nombre max de joueurs
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={22}
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="accent-vert-projecteur w-4 h-4"
                    />
                    <label htmlFor="isPublic" className="font-mono text-xs text-craie">
                      Match public (visible par tous les joueurs)
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-encre/40">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      loading={createMutation.isPending}
                    >
                      Publier le match
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
