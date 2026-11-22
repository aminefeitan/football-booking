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
    enabled: activeTab === "stats",
  });

  // Mutations
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => updateUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setFeedback({ text: "Statut utilisateur mis à jour !" });
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
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-jaune-carton mb-1 flex items-center gap-1.5">
            <ShieldCheck size={16} weight="bold" /> Console Administrateur
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-craie">
            Administration <span className="text-jaune-carton">Système</span>
          </h1>
        </div>

        {feedback && (
          <div
            className={`p-3 border-2 font-mono text-xs flex items-center gap-2 ${
              feedback.error
                ? "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet"
                : "border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur"
            }`}
          >
            {feedback.error ? <WarningCircle size={16} /> : <CheckCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Onglets navigation Admin */}
        <div className="flex flex-wrap gap-2 border-b-2 border-encre pb-2">
          {[
            { id: "users", label: "Utilisateurs", icon: Users },
            { id: "fields", label: "Terrains à Valider", icon: SoccerBall },
            { id: "stats", label: "Statistiques Globales", icon: ChartBar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => router.push(`/admin?tab=${id}`)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                activeTab === id
                  ? "border-jaune-carton bg-jaune-carton text-encre shadow-brutal"
                  : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
              }`}
            >
              <Icon size={16} weight="bold" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 1. UTILISATEURS ── */}
        {activeTab === "users" && (
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70">
                Gestion des comptes utilisateurs ({filteredUsers.length})
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateManagerModal(true)}
                className="shadow-brutal"
              >
                <UserPlus size={16} weight="bold" />
                Créer un gérant de terrain
              </Button>
            </div>

            {/* Filtres Utilisateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par nom ou email…"
                className="border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="PLAYER">PLAYER (Joueur)</option>
                <option value="FIELD_MANAGER">FIELD_MANAGER (Gérant)</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BANNED">BANNED</option>
              </select>
            </div>

            {loadingUsers ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des utilisateurs…</p>
            ) : filteredUsers.length === 0 ? (
              <p className="font-mono text-xs text-craie/40">Aucun utilisateur trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-nuit-pelouse border-b border-encre text-craie/50 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Téléphone</th>
                      <th className="p-3">Rôle</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Date création</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre/60">
                    {filteredUsers.map((u: User) => {
                      const isSelf = u.id === currentUser?.id;
                      const isTargetAdmin = u.role === "ADMIN";

                      return (
                        <tr key={u.id} className="hover:bg-nuit-pelouse/40">
                          <td className="p-3 font-bold text-craie">
                            {u.firstName} {u.lastName}{" "}
                            {isSelf && <span className="text-[10px] text-jaune-carton">(Vous)</span>}
                            {u.mustChangePassword && (
                              <span className="block text-[10px] text-orange-sifflet font-mono">
                                ⚠ Doit changer mdp
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-craie/70">{u.email}</td>
                          <td className="p-3 text-craie/50">{u.phone || "—"}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 font-bold uppercase text-[10px] border ${
                                u.role === "ADMIN"
                                  ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                                  : u.role === "FIELD_MANAGER"
                                  ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                                  : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            {isSelf || isTargetAdmin ? (
                              <span className="font-bold text-vert-projecteur uppercase">{u.status}</span>
                            ) : (
                              <select
                                value={u.status}
                                onChange={(e) =>
                                  statusMut.mutate({ id: u.id, status: e.target.value as UserStatus })
                                }
                                className="bg-nuit-pelouse border border-encre/60 text-craie px-2 py-1 outline-none text-xs"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                                <option value="BANNED">BANNED</option>
                              </select>
                            )}
                          </td>
                          <td className="p-3 text-craie/40">{formatDate(u.createdAt)}</td>
                          <td className="p-3 text-right">
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
                                className="text-orange-sifflet hover:bg-orange-sifflet/10 text-[11px]"
                              >
                                <Key size={14} />
                                Reset mot de passe
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
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-2">
              Demandes de validation de terrains en attente ({pendingFields.length})
            </h2>

            {loadingFields ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des terrains en attente…</p>
            ) : pendingFields.length === 0 ? (
              <div className="p-8 text-center bg-nuit-pelouse border border-encre">
                <CheckCircle size={36} className="mx-auto text-vert-projecteur mb-2" />
                <p className="font-mono text-sm text-craie/60">Aucun terrain en attente de validation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingFields.map((f: Field) => (
                  <div
                    key={f.id}
                    className="border-2 border-encre bg-nuit-pelouse p-4 shadow-brutal flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {f.photoUrl && (
                        <div className="h-40 w-full mb-3 overflow-hidden border border-encre">
                          <FieldPhoto photoUrl={f.photoUrl} alt={f.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="border border-jaune-carton/40 text-jaune-carton bg-jaune-carton/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                          En attente
                        </span>
                        <span className="font-mono text-xs text-craie/50">{f.fieldType}</span>
                      </div>
                      <h3 className="font-display font-black text-xl uppercase text-craie">{f.name}</h3>
                      <div className="font-mono text-xs text-craie/50 mt-1">
                        Propriétaire : <span className="text-craie font-bold">{f.ownerName || "Gérant"}</span>
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {f.address}, {f.city}
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {f.openTime} - {f.closeTime}
                      </div>
                      <div className="font-mono text-xs font-bold text-vert-projecteur mt-2">
                        {money(f.pricePerHour, f.currency)} / heure
                      </div>
                      {f.description && (
                        <p className="font-body text-xs text-craie/60 mt-1 italic">« {f.description} »</p>
                      )}
                    </div>

                    <div className="border-t border-encre/60 pt-3 flex items-center gap-2 justify-end">
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
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Revenu Total Confirmé</span>
                    <span className="font-display font-black text-3xl text-vert-projecteur">
                      {money(stats.totalRevenue)}
                    </span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Total Équipes</span>
                    <span className="font-display font-black text-3xl text-craie">{stats.totalTeams}</span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Total Matchs</span>
                    <span className="font-display font-black text-3xl text-craie">{stats.totalMatches}</span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Réservations Confirmées</span>
                    <span className="font-display font-black text-3xl text-jaune-carton">
                      {stats.bookingsByStatus?.CONFIRMED ?? 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Utilisateurs par rôle */}
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal space-y-2">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-1">
                      Utilisateurs par Rôle
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                        <div key={role} className="flex justify-between">
                          <span className="text-craie/60">{role} :</span>
                          <span className="font-bold text-craie">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terrains par statut */}
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal space-y-2">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-1">
                      Terrains par Statut
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      {Object.entries(stats.fieldsByStatus || {}).map(([st, count]) => (
                        <div key={st} className="flex justify-between">
                          <span className="text-craie/60">{st} :</span>
                          <span className="font-bold text-craie">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Réservations par statut */}
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal space-y-2">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-1">
                      Réservations par Statut
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      {Object.entries(stats.bookingsByStatus || {}).map(([st, count]) => (
                        <div key={st} className="flex justify-between">
                          <span className="text-craie/60">{st} :</span>
                          <span className="font-bold text-craie">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL CRÉER UN GÉRANT ── */}
      {showCreateManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="border-2 border-encre bg-encre p-6 shadow-brutal max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-encre/60 pb-2">
              <h2 className="font-display font-black text-2xl uppercase text-craie">
                Créer un <span className="text-jaune-carton">Gérant</span>
              </h2>
              <button
                onClick={() => setShowCreateManagerModal(false)}
                className="text-craie/60 hover:text-craie font-mono"
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
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-craie/60 block">Prénom</label>
                  <input
                    type="text"
                    required
                    value={mgrFirstName}
                    onChange={(e) => setMgrFirstName(e.target.value)}
                    placeholder="Karim"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-craie/60 block">Nom</label>
                  <input
                    type="text"
                    required
                    value={mgrLastName}
                    onChange={(e) => setMgrLastName(e.target.value)}
                    placeholder="El Idrissi"
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-craie/60 block">Email</label>
                <input
                  type="email"
                  required
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  placeholder="gerant@example.com"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-craie/60 block">Téléphone (optionnel)</label>
                <input
                  type="tel"
                  value={mgrPhone}
                  onChange={(e) => setMgrPhone(e.target.value)}
                  placeholder="+212600000000"
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-jaune-carton"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateManagerModal(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={createManagerMut.isPending}>
                  Générer le compte
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL MOT DE PASSE TEMPORAIRE (AFFICHÉ UNE SEULE FOIS) ── */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="border-2 border-jaune-carton bg-encre p-6 shadow-brutal max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-jaune-carton">
              <Key size={24} weight="bold" />
              <h2 className="font-display font-black text-2xl uppercase text-craie">
                {tempPasswordModal.isReset ? "Mot de passe réinitialisé" : "Compte Gérant Créé"}
              </h2>
            </div>

            <div className="p-3 border-2 border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet font-mono text-xs">
              <span className="font-bold block mb-1">⚠ Shown only once.</span>
              Give it to the manager; he must change it at first login.
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="text-craie/60">Compte :</div>
              <div className="font-bold text-craie">{tempPasswordModal.email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-craie/60 block">Mot de passe temporaire :</label>
              <div className="flex items-center border-2 border-jaune-carton bg-nuit-pelouse p-2 justify-between">
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
