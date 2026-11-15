"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Crown,
  Plus,
  Lock,
  X,
  CheckCircle,
  EnvelopeSimple,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import {
  getTeams,
  createTeam,
  getPendingInvitations,
  acceptInvitation,
} from "@/services/teams.service";
import { Button } from "@/components/ui/Button";
import type { Team, TeamInvitation } from "@/lib/types";

export default function TeamsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [cityFilter, setCityFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Khenifra");
  const [maxMembers, setMaxMembers] = useState(15);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", cityFilter],
    queryFn: () => getTeams(cityFilter || undefined),
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: getPendingInvitations,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setModalError(null);
      setFeedbackMsg("Équipe créée avec succès !");
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création de l'équipe";
      setModalError(msg);
    },
  });

  const acceptMut = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-invitations"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      setFeedbackMsg("Invitation acceptée ! Vous faites maintenant partie de l'équipe.");
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name,
      description,
      city,
      maxMembers: Number(maxMembers),
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
              ÉQUIPES
            </div>
            <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
              Équipes & Clubs
            </h1>
            <p className="font-mono text-xs text-craie/60 uppercase tracking-widest mt-2">
              Rejoins une équipe locale ou fonde ton propre club
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} weight="bold" />}
              >
                Créer une équipe
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => router.push("/auth?redirect=/equipes")}
                icon={<Lock size={16} weight="bold" />}
              >
                Connexion pour créer
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

        {/* Pending Invitations Section */}
        {isAuthenticated && invitations.length > 0 && (
          <div className="border-2 border-orange-sifflet bg-orange-sifflet/10 p-5 shadow-brutal mb-8">
            <div className="flex items-center gap-2 font-display font-black text-orange-sifflet uppercase text-lg mb-3">
              <EnvelopeSimple size={22} weight="bold" />
              Invitations en attente ({invitations.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="border border-orange-sifflet/40 bg-encre p-4 flex items-center justify-between gap-4 font-mono text-xs"
                >
                  <div>
                    <span className="text-craie font-bold text-sm block">
                      {inv.team?.name ?? "Équipe"}
                    </span>
                    <span className="text-craie/50 text-[10px]">
                      Invité par {inv.invitedBy ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}` : "Le capitaine"}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => acceptMut.mutate(inv.id)}
                    loading={acceptMut.isPending}
                  >
                    Accepter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar */}
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
            {teams.length} {teams.length > 1 ? "équipes répertoriées" : "équipe répertoriée"}
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal">
            <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest animate-pulse">
              Recherche des équipes en cours...
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal">
            <Users size={48} className="mx-auto text-craie/30 mb-4" />
            <div className="font-display font-black text-xl text-craie uppercase mb-2">
              Aucune équipe trouvée
            </div>
            <p className="font-mono text-xs text-craie/50 max-w-md mx-auto mb-6">
              Aucune équipe n&apos;est inscrite dans cette ville pour l&apos;instant. Crée ton propre club dès maintenant !
            </p>
            {isAuthenticated && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Créer une équipe
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((t) => {
              const membersCount = t.members?.length ?? 0;
              const max = t.maxMembers ?? 15;
              const isFull = membersCount >= max;

              return (
                <div
                  key={t.id}
                  className="border-2 border-encre bg-encre shadow-brutal hover:shadow-brutal-xl transition-shadow flex flex-col justify-between"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-vert-projecteur font-bold">
                        <MapPin size={14} weight="bold" />
                        <span>{t.city ?? "France"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs text-craie/60">
                        <Users size={14} weight="bold" />
                        <span>
                          {membersCount} / {max}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display font-black text-2xl text-craie uppercase mb-2 line-clamp-1">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="font-body text-xs text-craie/70 mb-4 line-clamp-2">
                        {t.description}
                      </p>
                    )}

                    <div className="space-y-1 font-mono text-xs text-craie/70 pt-3 border-t border-encre/40">
                      <div className="flex items-center gap-1.5">
                        <Crown size={14} className="text-jaune-carton" weight="fill" />
                        <span>
                          Capitaine :{" "}
                          {t.creator
                            ? `${t.creator.firstName} ${t.creator.lastName}`
                            : "Non assigné"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t-2 border-nuit-pelouse">
                    <Link
                      href={`/equipes/${t.id}`}
                      className="block w-full text-center border-2 border-encre bg-vert-projecteur text-encre hover:bg-orange-sifflet hover:text-craie px-4 py-2 font-mono text-xs font-black uppercase transition-colors shadow-brutal"
                    >
                      Voir l&apos;équipe & l&apos;effectif
                    </Link>
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
                    Créer une <span className="text-vert-projecteur">équipe</span>
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
                      Nom du club / de l&apos;équipe *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: FC Barbès, Les Fauves du 11ème"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-sm focus:border-vert-projecteur focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                      Description & Esprit du club
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ambiance, niveau recherché, rythme des matchs..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                        Effectif Maximum
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                        className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                      />
                    </div>
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
                      Créer le club
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
