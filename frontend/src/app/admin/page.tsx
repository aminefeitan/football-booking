"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  SoccerBall,
  ChartBar,
  ShieldCheck,
  CheckCircle,
  XCircle,
  WarningCircle,
  MapPin,
  Clock,
  UserPlus,
  Key,
  Copy,
  MagnifyingGlass,
  ArrowRight,
  Money,
  Trophy,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import {
  getAdminUsers,
  updateUserStatus,
  createFieldManager,
  resetUserPassword,
  getAdminStats,
} from "@/services/stats.service";
import { getAdminFields, reviewField } from "@/services/fields.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { FieldPhoto } from "@/components/ui/FieldPhoto";
import { formatDate, money } from "@/lib/format";
import type { User, Field, UserStatus, Role, FieldStatus, CreateFieldManagerRequest } from "@/lib/types";

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const activeTab = searchParams.get("tab") ?? "users";
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Users filters
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create field manager modal
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [mgrFirstName, setMgrFirstName] = useState("");
  const [mgrLastName, setMgrLastName] = useState("");
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrPhone, setMgrPhone] = useState("");

  // Temporary password display modal
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    email: string;
    temporaryPassword: string;
    isReset?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Queries
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
    enabled: activeTab === "users",
  });

  const { data: pendingFields = [], isLoading: loadingFields } = useQuery({
    queryKey: ["admin-fields-pending"],
    queryFn: () => getAdminFields("PENDING"),
    enabled: activeTab === "fields",
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    enabled: activeTab === "stats" || activeTab === "users",
  });

  // Mutations
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => updateUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setFeedback({ text: "Statut utilisateur mis à jour avec succès !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur mise à jour statut";
      setFeedback({ text: msg, error: true });
    },
  });

  const createManagerMut = useMutation({
    mutationFn: (req: CreateFieldManagerRequest) => createFieldManager(req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreateManagerModal(false);
      setMgrFirstName("");
      setMgrLastName("");
      setMgrEmail("");
      setMgrPhone("");
      setTempPasswordModal({
        email: data.user.email,
        temporaryPassword: data.temporaryPassword,
        isReset: false,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du gérant";
      setFeedback({ text: msg, error: true });
    },
  });

  const resetPasswordMut = useMutation({
    mutationFn: (userId: string) => resetUserPassword(userId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setTempPasswordModal({
        email: data.user.email,
        temporaryPassword: data.temporaryPassword,
        isReset: true,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur réinitialisation mot de passe";
      setFeedback({ text: msg, error: true });
    },
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FieldStatus }) => reviewField(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fields-pending"] });
      setFeedback({ text: "Statut du terrain mis à jour avec succès !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur validation terrain";
      setFeedback({ text: msg, error: true });
    },
  });

  const filteredUsers = users.filter((u: User) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
    );
  });

  const handleCopyPassword = () => {
    if (tempPasswordModal?.temporaryPassword) {
      navigator.clipboard.writeText(tempPasswordModal.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-encre/95 via-encre/80 to-nuit-pelouse/80 border border-craie/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-jaune-carton/30 bg-jaune-carton/10 font-mono text-xs uppercase tracking-wider text-jaune-carton">
              <ShieldCheck size={16} weight="bold" />
              <span>Console d&apos;Administration</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
              Supervision <span className="text-jaune-carton">Système</span>
            </h1>
            <p className="text-xs sm:text-sm text-craie/70 font-sans max-w-xl">
              Gérez les comptes utilisateurs, validez les nouveaux complexes sportifs et consultez les indicateurs de la plateforme.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateManagerModal(true)}
              className="shadow-lg shadow-vert-projecteur/20 flex items-center gap-2"
            >
              <UserPlus size={18} weight="bold" />
              <span>Nouveau Gérant</span>
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-3 backdrop-blur-md ${
              feedback.error
                ? "border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet"
                : "border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur"
            }`}
          >
            {feedback.error ? <WarningCircle size={20} weight="bold" /> : <CheckCircle size={20} weight="bold" />}
            <span className="font-sans text-sm font-medium">{feedback.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-encre/60 border border-craie/10 backdrop-blur-xl max-w-fit">
          {[
            { id: "users", label: `Utilisateurs (${users.length})`, icon: Users },
            { id: "fields", label: `Terrains à Valider (${pendingFields.length})`, icon: SoccerBall },
            { id: "stats", label: "Statistiques Globales", icon: ChartBar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => router.push(`/admin?tab=${id}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === id
                  ? "bg-jaune-carton text-encre shadow-md shadow-jaune-carton/20"
                  : "text-craie/60 hover:text-craie hover:bg-craie/5"
              }`}
            >
              <Icon size={16} weight="bold" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 1. UTILISATEURS ── */}
        {activeTab === "users" && (
          <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-craie/10 pb-4">
              <div>
                <h2 className="font-display font-black text-2xl uppercase tracking-wide text-craie">
                  Comptes Enregistrés ({filteredUsers.length})
                </h2>
                <p className="font-mono text-xs text-craie/50 mt-0.5">
                  Gestion des droits d'accès, statuts et réinitialisation de mot de passe
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-craie/40" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filtrer par nom ou email…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-craie/10 bg-nuit-pelouse text-craie text-xs font-mono outline-none focus:border-jaune-carton"
                />
              </div>
            </div>

            {/* Role & Status filter pills */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-craie/40 uppercase">Rôle :</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-xl border border-craie/10 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                >
                  <option value="ALL">Tous les rôles</option>
                  <option value="PLAYER">PLAYER (Joueur)</option>
                  <option value="FIELD_MANAGER">FIELD_MANAGER (Gérant)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-craie/40 uppercase">Statut :</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-craie/10 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BANNED">BANNED</option>
                </select>
              </div>
            </div>

            {loadingUsers ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des utilisateurs…</p>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-craie/20 p-8 text-center text-xs font-mono text-craie/50">
                Aucun utilisateur ne correspond aux filtres appliqués.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-craie/10">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-nuit-pelouse/80 border-b border-craie/10 text-craie/50 uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Utilisateur</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Téléphone</th>
                      <th className="p-3.5">Rôle</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5">Inscription</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-craie/5">
                    {filteredUsers.map((u: User) => {
                      const isSelf = u.id === currentUser?.id;
                      const isTargetAdmin = u.role === "ADMIN";

                      return (
                        <tr key={u.id} className="hover:bg-craie/5 transition-colors">
                          <td className="p-3.5 font-bold text-craie">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full bg-craie/10 text-vert-projecteur flex items-center justify-center font-bold text-xs shrink-0">
                                {u.firstName?.[0]?.toUpperCase() || "U"}
                              </span>
                              <div>
                                <span>{u.firstName} {u.lastName}</span>
                                {isSelf && <span className="ml-1.5 text-[10px] text-jaune-carton font-bold">(Vous)</span>}
                                {u.mustChangePassword && (
                                  <span className="block text-[10px] text-orange-sifflet font-mono">
                                    ⚠ Mdp temporaire
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-craie/70">{u.email}</td>
                          <td className="p-3.5 text-craie/50">{u.phone || "—"}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                                u.role === "ADMIN"
                                  ? "border-jaune-carton/40 text-jaune-carton bg-jaune-carton/10"
                                  : u.role === "FIELD_MANAGER"
                                  ? "border-orange-sifflet/40 text-orange-sifflet bg-orange-sifflet/10"
                                  : "border-vert-projecteur/40 text-vert-projecteur bg-vert-projecteur/10"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isSelf || isTargetAdmin ? (
                              <Badge variant="confirmed">{u.status}</Badge>
                            ) : (
                              <select
                                value={u.status}
                                onChange={(e) =>
                                  statusMut.mutate({ id: u.id, status: e.target.value as UserStatus })
                                }
                                className="bg-nuit-pelouse border border-craie/10 rounded-lg text-craie px-2 py-1 outline-none text-xs"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                                <option value="BANNED">BANNED</option>
                              </select>
                            )}
                          </td>
                          <td className="p-3.5 text-craie/40">{formatDate(u.createdAt)}</td>
                          <td className="p-3.5 text-right">
                            {!isSelf && !isTargetAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Réinitialiser le mot de passe pour ${u.email} ?`)) {
                                    resetPasswordMut.mutate(u.id);
                                  }
                                }}
                                loading={resetPasswordMut.isPending}
                                className="text-orange-sifflet hover:bg-orange-sifflet/10 text-xs"
                              >
                                <Key size={14} />
                                Reset
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 2. TERRAINS À VALIDER ── */}
        {activeTab === "fields" && (
          <div className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-craie/10 pb-4">
              <h2 className="font-display font-black text-2xl uppercase tracking-wide text-craie">
                Demandes de validation de terrains ({pendingFields.length})
              </h2>
              <p className="font-mono text-xs text-craie/50 mt-0.5">
                Vérifiez les infrastructures avant publication sur la plateforme
              </p>
            </div>

            {loadingFields ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des terrains en attente…</p>
            ) : pendingFields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-craie/20 p-12 text-center bg-nuit-pelouse/40 space-y-2">
                <CheckCircle size={40} className="mx-auto text-vert-projecteur" />
                <p className="font-mono text-sm text-craie/70 font-semibold">
                  Aucun terrain en attente de validation.
                </p>
                <p className="font-mono text-xs text-craie/40">
                  Tous les terrains soumis ont été traités.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingFields.map((f: Field) => (
                  <div
                    key={f.id}
                    className="rounded-3xl border border-craie/10 bg-nuit-pelouse/70 p-5 flex flex-col justify-between space-y-4 hover:border-craie/20 transition-all shadow-lg"
                  >
                    <div>
                      {f.photoUrl && (
                        <div className="h-44 w-full mb-3 rounded-2xl overflow-hidden border border-craie/10">
                          <FieldPhoto photoUrl={f.photoUrl} alt={f.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="pending">En attente</Badge>
                        <span className="font-mono text-xs text-craie/50">{f.fieldType}</span>
                      </div>
                      <h3 className="font-display font-black text-2xl uppercase text-craie">{f.name}</h3>
                      <div className="font-mono text-xs text-craie/60 mt-1">
                        Gérant : <span className="text-craie font-bold">{f.ownerName || "Gérant"}</span>
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1.5 mt-1">
                        <MapPin size={14} className="text-vert-projecteur" />
                        <span>{f.address}, {f.city}</span>
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1.5 mt-1">
                        <Clock size={14} className="text-vert-projecteur" />
                        <span>{f.openTime} - {f.closeTime}</span>
                      </div>
                      <div className="font-mono text-sm font-black text-vert-projecteur mt-2">
                        {money(f.pricePerHour, f.currency)} / heure
                      </div>
                      {f.description && (
                        <p className="font-sans text-xs text-craie/60 mt-2 italic bg-craie/5 p-2 rounded-lg">
                          « {f.description} »
                        </p>
                      )}
                    </div>

                    <div className="border-t border-craie/10 pt-4 flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => reviewMut.mutate({ id: f.id, status: "REJECTED" })}
                        loading={reviewMut.isPending}
                        className="text-orange-sifflet hover:bg-orange-sifflet/10"
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => reviewMut.mutate({ id: f.id, status: "APPROVED" })}
                        loading={reviewMut.isPending}
                        className="shadow-md shadow-vert-projecteur/20"
                      >
                        Valider & Publier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. STATISTIQUES GLOBALES ── */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {loadingStats ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des statistiques système…</p>
            ) : !stats ? (
              <p className="font-mono text-xs text-craie/40">Données non disponibles.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Chiffre d'Affaires Global"
                    value={money(stats.totalRevenue)}
                    subtitle="Réservations confirmées"
                    icon={Money}
                    accentColor="green"
                  />
                  <StatCard
                    title="Clubs & Équipes"
                    value={stats.totalTeams}
                    subtitle="Équipes inscrites"
                    icon={Trophy}
                    accentColor="yellow"
                  />
                  <StatCard
                    title="Matchs Organisés"
                    value={stats.totalMatches}
                    subtitle="Confrontations créées"
                    icon={SoccerBall}
                    accentColor="default"
                  />
                  <StatCard
                    title="Résas Confirmées"
                    value={stats.bookingsByStatus?.CONFIRMED ?? 0}
                    subtitle="Séances validées"
                    icon={CheckCircle}
                    accentColor="green"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Utilisateurs par rôle */}
                  <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 space-y-4 shadow-xl">
                    <h3 className="font-display font-black text-lg uppercase tracking-wide text-craie border-b border-craie/10 pb-2">
                      Utilisateurs par Rôle
                    </h3>
                    <div className="space-y-2 font-mono text-xs">
                      {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                        <div key={role} className="flex justify-between items-center p-2 rounded-xl bg-craie/5">
                          <span className="text-craie/70 font-semibold">{role} :</span>
                          <span className="font-black text-vert-projecteur text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terrains par statut */}
                  <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 space-y-4 shadow-xl">
                    <h3 className="font-display font-black text-lg uppercase tracking-wide text-craie border-b border-craie/10 pb-2">
                      Terrains par Statut
                    </h3>
                    <div className="space-y-2 font-mono text-xs">
                      {Object.entries(stats.fieldsByStatus || {}).map(([st, count]) => (
                        <div key={st} className="flex justify-between items-center p-2 rounded-xl bg-craie/5">
                          <span className="text-craie/70 font-semibold">{st} :</span>
                          <span className="font-black text-jaune-carton text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Réservations par statut */}
                  <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 space-y-4 shadow-xl">
                    <h3 className="font-display font-black text-lg uppercase tracking-wide text-craie border-b border-craie/10 pb-2">
                      Réservations par Statut
                    </h3>
                    <div className="space-y-2 font-mono text-xs">
                      {Object.entries(stats.bookingsByStatus || {}).map(([st, count]) => (
                        <div key={st} className="flex justify-between items-center p-2 rounded-xl bg-craie/5">
                          <span className="text-craie/70 font-semibold">{st} :</span>
                          <span className="font-black text-orange-sifflet text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MODAL CRÉER UN GÉRANT ── */}
        {showCreateManagerModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="rounded-3xl border border-craie/15 bg-encre/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-5">
              <div className="flex items-center justify-between border-b border-craie/10 pb-3">
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  Créer un compte <span className="text-jaune-carton">Gérant</span>
                </h2>
                <button
                  onClick={() => setShowCreateManagerModal(false)}
                  className="w-8 h-8 rounded-full bg-craie/10 text-craie/60 hover:text-craie flex items-center justify-center font-mono"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createManagerMut.mutate({
                    firstName: mgrFirstName.trim(),
                    lastName: mgrLastName.trim(),
                    email: mgrEmail.trim(),
                    phone: mgrPhone.trim() || undefined,
                  });
                }}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-craie/60 block">Prénom</label>
                    <input
                      type="text"
                      required
                      value={mgrFirstName}
                      onChange={(e) => setMgrFirstName(e.target.value)}
                      placeholder="Karim"
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-xs font-mono outline-none focus:border-jaune-carton"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-craie/60 block">Nom</label>
                    <input
                      type="text"
                      required
                      value={mgrLastName}
                      onChange={(e) => setMgrLastName(e.target.value)}
                      placeholder="El Idrissi"
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-xs font-mono outline-none focus:border-jaune-carton"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-craie/60 block">Email</label>
                  <input
                    type="email"
                    required
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    placeholder="gerant@complexe.ma"
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-xs font-mono outline-none focus:border-jaune-carton"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-craie/60 block">Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    value={mgrPhone}
                    onChange={(e) => setMgrPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-xs font-mono outline-none focus:border-jaune-carton"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-craie/10">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateManagerModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" type="submit" loading={createManagerMut.isPending}>
                    Générer les accès
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL MOT DE PASSE TEMPORAIRE ── */}
        {tempPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="rounded-3xl border border-jaune-carton/40 bg-encre/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-5">
              <div className="flex items-center gap-3 text-jaune-carton">
                <Key size={24} weight="bold" />
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  {tempPasswordModal.isReset ? "Mot de passe réinitialisé" : "Compte Gérant Créé"}
                </h2>
              </div>

              <div className="p-3.5 rounded-2xl border border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet font-mono text-xs">
                <span className="font-bold block mb-1">⚠ Affiché une seule fois.</span>
                Transmettez ce mot de passe temporaire au gérant ; il devra le renouveler à sa première connexion.
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="text-craie/60">Compte :</div>
                <div className="font-bold text-craie">{tempPasswordModal.email}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-craie/60 block">Mot de passe temporaire :</label>
                <div className="flex items-center rounded-2xl border border-jaune-carton/60 bg-nuit-pelouse p-3 justify-between">
                  <span className="font-mono font-black text-lg text-jaune-carton select-all">
                    {tempPasswordModal.temporaryPassword}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCopyPassword} className="text-craie hover:text-jaune-carton">
                    <Copy size={16} />
                    {copied ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setTempPasswordModal(null)}
                >
                  J'ai noté le mot de passe
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Suspense>
        <AdminPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
