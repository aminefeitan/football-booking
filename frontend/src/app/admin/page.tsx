"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  SoccerBall,
  Ticket,
  CurrencyEur,
  Lock,
  User,
  MagnifyingGlass,
  CheckCircle,
  Building,
  ArrowClockwise,
  Warning,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { User as UserType, Field, Booking, UserStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── Composant LoadingSpinner ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-jaune-carton border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Composant ErrorBanner ────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isNetwork = message.includes("Connexion impossible") || message.includes("WildFly") || message.includes("Failed to fetch");
  return (
    <div className="border-2 border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet p-4 font-mono text-xs shadow-brutal space-y-2">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 font-bold text-sm">
          <Warning size={18} weight="bold" className="shrink-0" />
          {isNetwork ? "Serveur backend inaccessible" : "Erreur de chargement"}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="border-2 border-orange-sifflet bg-orange-sifflet text-craie px-3 py-1 hover:bg-orange-sifflet/80 transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase text-[11px] shrink-0"
          >
            <ArrowClockwise size={14} weight="bold" /> Réessayer
          </button>
        )}
      </div>
      <p className="text-craie/70 text-[11px] leading-relaxed">
        {message}
      </p>
      {isNetwork && (
        <div className="text-[10px] text-jaune-carton bg-encre/60 p-2 border border-encre font-mono">
          💡 <strong>Astuce :</strong> Assurez-vous que le serveur backend WildFly / Java est démarré sur le port 8080.
        </div>
      )}
    </div>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "users" | "fields" | "bookings" | null;

  const { isAuthenticated, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "fields" | "bookings">(
    tabParam && ["users", "fields", "bookings"].includes(tabParam) ? tabParam : "users"
  );

  useEffect(() => {
    if (tabParam && ["users", "fields", "bookings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // ── Data states ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserType[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [usersLoading, setUsersLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [usersError, setUsersError] = useState<string | null>(null);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // ── UI states ────────────────────────────────────────────────────────────
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await api<UserType[]>("/admin/users", { auth: true });
      setUsers(data);
    } catch (err: unknown) {
      setUsersError(err instanceof Error ? err.message : "Erreur lors du chargement des utilisateurs");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchFields = useCallback(async () => {
    setFieldsLoading(true);
    setFieldsError(null);
    try {
      const data = await api<Field[]>("/admin/fields", { auth: true });
      setFields(data);
    } catch (err: unknown) {
      setFieldsError(err instanceof Error ? err.message : "Erreur lors du chargement des terrains");
    } finally {
      setFieldsLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const data = await api<Booking[]>("/admin/bookings", { auth: true });
      setBookings(data);
    } catch (err: unknown) {
      setBookingsError(err instanceof Error ? err.message : "Erreur lors du chargement des réservations");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // ── Chargement automatique au montage (si admin authentifié) ─────────────
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchFields();
      fetchBookings();
    }
  }, [isAuthenticated, isAdmin, fetchUsers, fetchFields, fetchBookings]);

  // ── Actions d'administration ──────────────────────────────────────────────
  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      const updated = await api<UserType>(`/admin/users/${userId}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: newStatus },
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showNotice(`Statut mis à jour : ${newStatus}`);
    } catch (err: unknown) {
      showNotice(`Erreur : ${err instanceof Error ? err.message : "Action impossible"}`);
    }
  };

  const handleToggleFieldStatus = async (fieldId: string, currentActive: boolean) => {
    try {
      const updated = await api<Field>(`/admin/fields/${fieldId}/active`, {
        method: "PATCH",
        auth: true,
        body: { active: !currentActive },
      });
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showNotice(`Terrain ${updated.active ? "activé" : "désactivé"} : ${updated.name}`);
    } catch (err: unknown) {
      showNotice(`Erreur : ${err instanceof Error ? err.message : "Action impossible"}`);
    }
  };

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Filtrage utilisateurs ─────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase();
    const matchesSearch =
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ── Métriques ─────────────────────────────────────────────────────────────
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // ── Écran de chargement ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-jaune-carton uppercase tracking-widest">
            Vérification des privilèges administrateur...
          </div>
        </div>
      </div>
    );
  }

  // ── Écran de garde ────────────────────────────────────────────────────────
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full border-2 border-encre bg-encre p-8 shadow-brutal-xl text-center">
          <div className="inline-flex items-center gap-2 border-2 border-jaune-carton bg-jaune-carton text-encre px-3 py-1 font-mono font-bold text-xs uppercase tracking-widest mb-6 shadow-brutal">
            <Lock size={14} weight="bold" />
            Zone Haute Sécurité
          </div>
          <div className="w-16 h-16 border-2 border-encre bg-jaune-carton text-encre flex items-center justify-center mx-auto mb-6 shadow-brutal">
            <ShieldCheck size={36} weight="fill" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase text-craie mb-3">
            Espace <span className="text-jaune-carton">Administration</span>
          </h1>
          <p className="text-craie/70 text-sm font-body mb-8 leading-relaxed">
            Ce portail est strictement réservé aux administrateurs système de FootBook.
          </p>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/auth?redirect=/admin")}
              icon={<User size={16} weight="bold" />}
            >
              Connexion administrateur
            </Button>
            <Button variant="ghost" size="md" className="w-full" onClick={() => router.push("/")}>
              Retour au site public
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse text-craie py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="border-2 border-encre bg-encre p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 border border-jaune-carton bg-jaune-carton/15 text-jaune-carton px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest mb-2">
              <ShieldCheck size={14} weight="bold" />
              Supervision Globale de la Plateforme
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight text-craie">
              Panneau <span className="text-jaune-carton">Administration</span>
            </h1>
            <p className="font-mono text-xs text-craie/50 mt-1">
              Données en temps réel — Base de données FootBook
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-vert-projecteur animate-pulse border border-encre" />
            <span className="font-mono text-xs uppercase font-bold text-vert-projecteur">
              Système Opérationnel
            </span>
          </div>
        </div>

        {/* ── FEEDBACK FLASH ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur px-4 py-3 font-mono text-xs font-bold shadow-brutal flex items-center justify-between"
            >
              <span>{feedback}</span>
              <CheckCircle size={18} weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MÉTRIQUES GLOBALES ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between text-craie/40 mb-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Utilisateurs</span>
              <Users size={20} weight="bold" className="text-vert-projecteur" />
            </div>
            <div className="font-mono font-black text-3xl md:text-4xl text-vert-projecteur">{users.length}</div>
            <div className="font-mono text-[10px] text-craie/40 mt-1 uppercase">Joueurs, gérants & admins</div>
          </div>

          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between text-craie/40 mb-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Terrains</span>
              <SoccerBall size={20} weight="bold" className="text-orange-sifflet" />
            </div>
            <div className="font-mono font-black text-3xl md:text-4xl text-orange-sifflet">{fields.length}</div>
            <div className="font-mono text-[10px] text-craie/40 mt-1 uppercase">
              {fields.filter((f) => f.active).length} actifs · {fields.filter((f) => !f.active).length} inactifs
            </div>
          </div>

          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between text-craie/40 mb-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Réservations</span>
              <Ticket size={20} weight="bold" className="text-jaune-carton" />
            </div>
            <div className="font-mono font-black text-3xl md:text-4xl text-jaune-carton">{bookings.length}</div>
            <div className="font-mono text-[10px] text-craie/40 mt-1 uppercase">Total historique</div>
          </div>

          <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
            <div className="flex items-center justify-between text-craie/40 mb-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Volume d'affaires</span>
              <CurrencyEur size={20} weight="bold" className="text-craie" />
            </div>
            <div className="font-mono font-black text-3xl md:text-4xl text-craie">{formatPrice(totalRevenue)}</div>
            <div className="font-mono text-[10px] text-craie/40 mt-1 uppercase">Transactions confirmées</div>
          </div>
        </div>

        {/* ── ONGLETS ──────────────────────────────────────────────────────── */}
        <div className="border-b-2 border-encre flex gap-2">
          {[
            { id: "users", label: "Gestion des utilisateurs", count: users.length },
            { id: "fields", label: "Gestion des terrains", count: fields.length },
            { id: "bookings", label: "Historique & Litiges", count: bookings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-jaune-carton bg-jaune-carton text-encre shadow-brutal font-black -mb-[2px]"
                  : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* ── ONGLET 1 : UTILISATEURS ──────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
              <div className="flex-1 flex items-center border-2 border-encre bg-encre px-3 py-2">
                <MagnifyingGlass size={16} weight="bold" className="text-jaune-carton mr-2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="bg-transparent text-craie placeholder-craie/30 text-xs font-mono outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs uppercase text-craie/50">Rôle :</span>
                {["ALL", "PLAYER", "FIELD_MANAGER", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase border-2 transition-colors cursor-pointer ${
                      roleFilter === r
                        ? "border-jaune-carton bg-jaune-carton text-encre"
                        : "border-encre bg-encre text-craie/60 hover:border-craie/40"
                    }`}
                  >
                    {r === "ALL" ? "Tous" : r === "FIELD_MANAGER" ? "Gérants" : r === "PLAYER" ? "Joueurs" : "Admins"}
                  </button>
                ))}
                <button onClick={fetchUsers} className="px-2.5 py-1.5 border-2 border-encre text-craie/60 hover:border-vert-projecteur hover:text-vert-projecteur cursor-pointer transition-colors">
                  <ArrowClockwise size={14} weight="bold" />
                </button>
              </div>
            </div>

            {usersError && <ErrorBanner message={usersError} onRetry={fetchUsers} />}
            {usersLoading ? <Spinner /> : (
              <div className="border-2 border-encre bg-encre overflow-x-auto shadow-brutal">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-encre bg-nuit-pelouse text-craie/50 font-mono text-[11px] uppercase tracking-wider">
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Rôle</th>
                      <th className="p-3">Détails</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Modération</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre/60 font-mono text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-craie/40">
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-nuit-pelouse/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-craie">{u.firstName} {u.lastName}</div>
                          <div className="text-[11px] text-craie/40">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
                            u.role === "ADMIN"
                              ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                              : u.role === "FIELD_MANAGER"
                              ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                              : "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                          }`}>
                            {u.role === "ADMIN" ? "Admin" : u.role === "FIELD_MANAGER" ? "Gérant" : "Joueur"}
                          </span>
                        </td>
                        <td className="p-3 text-craie/70 text-[11px]">
                          {u.businessName ? (
                            <span className="flex items-center gap-1 text-orange-sifflet font-bold">
                              <Building size={14} /> {u.businessName}
                            </span>
                          ) : u.preferredPosition ? (
                            <span>{u.preferredPosition} · {u.skillLevel ?? "Amateur"}</span>
                          ) : (
                            <span>{u.department ?? u.city ?? "—"}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
                            u.status === "ACTIVE"
                              ? "border-vert-projecteur text-vert-projecteur"
                              : u.status === "SUSPENDED"
                              ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                              : "border-red-500 text-red-500 bg-red-500/10"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {u.role !== "ADMIN" && (
                            <>
                              {u.status !== "ACTIVE" && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, "ACTIVE")}
                                  className="px-2 py-1 bg-vert-projecteur text-encre text-[10px] font-bold uppercase hover:opacity-90 cursor-pointer"
                                >
                                  Activer
                                </button>
                              )}
                              {u.status !== "SUSPENDED" && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, "SUSPENDED")}
                                  className="px-2 py-1 bg-orange-sifflet text-craie text-[10px] font-bold uppercase hover:opacity-90 cursor-pointer"
                                >
                                  Suspendre
                                </button>
                              )}
                              {u.status !== "BANNED" && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, "BANNED")}
                                  className="px-2 py-1 border border-red-600 text-red-400 text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white cursor-pointer"
                                >
                                  Bannir
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 2 : TERRAINS ──────────────────────────────────────────── */}
        {activeTab === "fields" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={fetchFields} className="flex items-center gap-1.5 border-2 border-encre px-3 py-1.5 text-craie/60 hover:border-vert-projecteur hover:text-vert-projecteur cursor-pointer transition-colors font-mono text-xs uppercase font-bold">
                <ArrowClockwise size={14} weight="bold" /> Actualiser
              </button>
            </div>
            {fieldsError && <ErrorBanner message={fieldsError} onRetry={fetchFields} />}
            {fieldsLoading ? <Spinner /> : (
              <div className="border-2 border-encre bg-encre overflow-x-auto shadow-brutal">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-encre bg-nuit-pelouse text-craie/50 font-mono text-[11px] uppercase tracking-wider">
                      <th className="p-3">Nom du terrain</th>
                      <th className="p-3">Ville</th>
                      <th className="p-3">Format</th>
                      <th className="p-3">Tarif / Heure</th>
                      <th className="p-3">Propriétaire</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Action Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre/60 font-mono text-xs">
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-craie/40">Aucun terrain enregistré</td>
                      </tr>
                    ) : fields.map((f) => (
                      <tr key={f.id} className="hover:bg-nuit-pelouse/40 transition-colors">
                        <td className="p-3 font-bold text-craie">{f.name}</td>
                        <td className="p-3 text-craie/70">{f.city ?? "—"}</td>
                        <td className="p-3">
                          <span className="border border-craie/30 px-1.5 py-0.5 text-[10px] font-bold">{f.fieldType}</span>
                        </td>
                        <td className="p-3 font-bold text-vert-projecteur">{formatPrice(f.pricePerHour)}</td>
                        <td className="p-3 text-craie/60 text-[11px]">
                          {f.owner ? `${f.owner.firstName} ${f.owner.lastName}` : "—"}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
                            f.active
                              ? "border-vert-projecteur text-vert-projecteur"
                              : "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                          }`}>
                            {f.active ? "En ligne" : "Hors ligne"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleFieldStatus(f.id, f.active)}
                            className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 transition-colors cursor-pointer ${
                              f.active
                                ? "border-orange-sifflet text-orange-sifflet hover:bg-orange-sifflet hover:text-craie"
                                : "border-vert-projecteur text-vert-projecteur hover:bg-vert-projecteur hover:text-encre"
                            }`}
                          >
                            {f.active ? "Désactiver" : "Activer"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 3 : HISTORIQUE ────────────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={fetchBookings} className="flex items-center gap-1.5 border-2 border-encre px-3 py-1.5 text-craie/60 hover:border-vert-projecteur hover:text-vert-projecteur cursor-pointer transition-colors font-mono text-xs uppercase font-bold">
                <ArrowClockwise size={14} weight="bold" /> Actualiser
              </button>
            </div>
            {bookingsError && <ErrorBanner message={bookingsError} onRetry={fetchBookings} />}
            {bookingsLoading ? <Spinner /> : (
              <div className="border-2 border-encre bg-encre overflow-x-auto shadow-brutal">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-encre bg-nuit-pelouse text-craie/50 font-mono text-[11px] uppercase tracking-wider">
                      <th className="p-3">Réf</th>
                      <th className="p-3">Terrain</th>
                      <th className="p-3">Joueur</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre/60 font-mono text-xs">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-craie/40">Aucune réservation enregistrée</td>
                      </tr>
                    ) : bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-nuit-pelouse/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-jaune-carton">
                          #{b.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3 text-craie">{b.field?.name ?? "—"} <span className="text-craie/40">({b.field?.city ?? "—"})</span></td>
                        <td className="p-3 text-craie/70">
                          {b.user ? `${b.user.firstName} ${b.user.lastName}` : "—"}
                        </td>
                        <td className="p-3 text-craie/70">{formatDate(b.startAt)}</td>
                        <td className="p-3 font-bold text-vert-projecteur">{formatPrice(b.totalAmount)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
                            b.status === "CONFIRMED" || b.status === "COMPLETED"
                              ? "border-vert-projecteur text-vert-projecteur"
                              : b.status === "CANCELLED" || b.status === "EXPIRED"
                              ? "border-red-500 text-red-400"
                              : "border-jaune-carton text-jaune-carton"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
          <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
            <div className="font-mono text-sm text-jaune-carton uppercase tracking-widest">
              Chargement du panneau administration...
            </div>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
