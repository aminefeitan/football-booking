"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  MapPin,
  SoccerBall,
  Star,
  CheckCircle,
  CreditCard,
  PencilSimple,
  X,
  Lock,
  Ticket,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile, updateMyProfile } from "@/services/players.service";
import { getMyPayments } from "@/services/payments.service";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatDate } from "@/lib/utils";

const POSITIONS = [
  "Attaquant",
  "Milieu offensif",
  "Milieu défensif",
  "Défenseur central",
  "Latéral",
  "Gardien",
  "Polyvalent",
];

const SKILL_LEVELS = [
  "Débutant",
  "Intermédiaire",
  "Avancé",
  "Confirmé / Club",
  "Semi-Pro",
];

export default function ProfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated, loading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states
  const [preferredPosition, setPreferredPosition] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [available, setAvailable] = useState(true);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["player-profile"],
    queryFn: async () => {
      const data = await getMyProfile();
      setPreferredPosition(data.preferredPosition ?? "Polyvalent");
      setSkillLevel(data.skillLevel ?? "Intermédiaire");
      setCity(data.city ?? "Paris");
      setBio(data.bio ?? "");
      setAvailable(data.available ?? true);
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-my"],
    queryFn: getMyPayments,
    enabled: isAuthenticated,
  });

  const updateMut = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["player-profile"] });
      setIsEditing(false);
      setFeedback("Profil mis à jour avec succès !");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  if (loading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
            Chargement de votre profil...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
        <div className="max-w-md w-full border-2 border-encre bg-encre p-8 shadow-brutal text-center">
          <Lock size={32} className="mx-auto text-orange-sifflet mb-4" />
          <h2 className="font-display font-black text-2xl text-craie uppercase mb-2">
            Connexion Requise
          </h2>
          <p className="font-mono text-xs text-craie/60 mb-6">
            Vous devez être connecté pour accéder à votre profil joueur et vos paiements.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/auth?redirect=/profil")}
            className="w-full"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({
      preferredPosition,
      skillLevel,
      city,
      bio,
      available,
    });
  };

  const initiales = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div
            aria-hidden="true"
            className="font-display font-black text-vert-projecteur/10 text-[60px] leading-none select-none -mb-2"
          >
            PROFIL
          </div>
          <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
            Mon Espace Joueur
          </h1>
        </div>

        {feedback && (
          <div className="mb-6 p-4 border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur font-mono font-bold text-sm shadow-brutal flex items-center gap-2">
            <CheckCircle size={20} weight="bold" />
            {feedback}
          </div>
        )}

        {/* Fiche Profil principale */}
        <div className="border-2 border-encre bg-encre shadow-brutal-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-encre/40 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-encre bg-vert-projecteur text-encre flex items-center justify-center font-display font-black text-2xl shadow-brutal">
                {initiales || "FB"}
              </div>
              <div>
                <h2 className="font-display font-black text-2xl text-craie uppercase">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="font-mono text-xs text-craie/60">{user?.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10">
                    {user?.role}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${
                      available
                        ? "border-vert-projecteur text-vert-projecteur"
                        : "border-craie/30 text-craie/50"
                    }`}
                  >
                    {available ? "Disponible pour matchs" : "Indisponible"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant={isEditing ? "ghost" : "primary"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              icon={isEditing ? <X size={16} /> : <PencilSimple size={16} />}
            >
              {isEditing ? "Fermer" : "Modifier le profil"}
            </Button>
          </div>

          {/* Mode Édition */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                    Poste préféré
                  </label>
                  <select
                    value={preferredPosition}
                    onChange={(e) => setPreferredPosition(e.target.value)}
                    className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                    Niveau technique
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                  >
                    {SKILL_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                  Ville de jeu
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-craie uppercase mb-1">
                  Biographie / Style de jeu
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-nuit-pelouse border-2 border-encre text-craie px-3 py-2 font-mono text-xs focus:border-vert-projecteur focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="accent-vert-projecteur w-4 h-4"
                />
                <label htmlFor="available" className="font-mono text-xs text-craie">
                  Activer la disponibilité pour les recrutements et matchs amicaux
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-encre/40">
                <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" loading={updateMut.isPending}>
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          ) : (
            /* Mode Lecture */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-craie">
              <div className="border-2 border-encre bg-nuit-pelouse p-4">
                <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                  <SoccerBall size={16} /> Poste
                </div>
                <div className="font-bold text-sm">{profile?.preferredPosition ?? "Polyvalent"}</div>
              </div>

              <div className="border-2 border-encre bg-nuit-pelouse p-4">
                <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                  <Star size={16} /> Niveau
                </div>
                <div className="font-bold text-sm">{profile?.skillLevel ?? "Intermédiaire"}</div>
              </div>

              <div className="border-2 border-encre bg-nuit-pelouse p-4">
                <div className="flex items-center gap-2 text-vert-projecteur mb-1 uppercase font-bold">
                  <MapPin size={16} /> Ville
                </div>
                <div className="font-bold text-sm">{profile?.city ?? user?.city ?? "Non renseigné"}</div>
              </div>

              {profile?.bio && (
                <div className="sm:col-span-3 border-2 border-encre bg-nuit-pelouse p-4">
                  <div className="text-craie/50 text-[10px] uppercase font-bold mb-1">Bio</div>
                  <div className="text-craie/90 font-body text-xs">{profile.bio}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historique des Paiements */}
        <div className="border-2 border-encre bg-encre shadow-brutal p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-encre/40 mb-6">
            <h2 className="font-display font-black text-2xl text-craie uppercase flex items-center gap-2">
              <CreditCard size={24} className="text-vert-projecteur" />
              Historique des Paiements ({payments.length})
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/mes-reservations")}
              icon={<Ticket size={16} />}
            >
              Mes Réservations
            </Button>
          </div>

          {payments.length === 0 ? (
            <p className="font-mono text-xs text-craie/40 italic py-6 text-center border border-encre/40 bg-nuit-pelouse">
              Aucun paiement enregistré pour l&apos;instant.
            </p>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {payments.map((p) => {
                const isPaid = p.status === "COMPLETED";

                return (
                  <div
                    key={p.id}
                    className="border-2 border-encre bg-nuit-pelouse p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                            isPaid
                              ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                              : "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-craie/50 text-[10px]">
                          Réf: {p.transactionRef ?? p.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-craie font-bold">
                        {p.booking?.field?.name ?? "Réservation de terrain"}
                      </div>
                      <div className="text-craie/50 text-[10px]">
                        {p.createdAt ? formatDate(p.createdAt) : "Date non précisée"} • Méthode : {p.paymentMethod ?? "CARD"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-vert-projecteur font-bold text-lg">
                        {formatPrice(p.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
