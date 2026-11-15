"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendUp,
  CalendarCheck,
  CurrencyEur,
  XCircle,
  ChartBar,
  Lock,
  User,
  ArrowClockwise,
  Warning,
  SoccerBall,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Sparkle,
  X,
  SlidersHorizontal,
  Users,
  Crown,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getMatches } from "@/services/matches.service";
import { getTeams } from "@/services/teams.service";
import { formatPrice, formatDate, formatTime, formatTime12h, formatWorkingHours, formatFieldType } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Field, Booking, Match, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── DTOs ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalFields: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings?: number;
  cancelledBookings: number;
  totalRevenue: number;
}

interface NewFieldForm {
  name: string;
  city: string;
  address: string;
  postalCode?: string;
  phone?: string;
  fieldType: string;
  surfaceType: string;
  capacity: number;
  pricePerHour: number;
  currency: string;
  indoor: boolean;
  hasLights: boolean;
  hasLockerRoom: boolean;
  hasParking: boolean;
  openTime: string;
  closeTime: string;
  description?: string;
}

const INITIAL_FORM: NewFieldForm = {
  name: "",
  city: "Casablanca",
  address: "",
  phone: "",
  fieldType: "5v5",
  surfaceType: "Synthétique",
  capacity: 10,
  pricePerHour: 400,
  currency: "MAD",
  indoor: false,
  hasLights: true,
  hasLockerRoom: true,
  hasParking: true,
  openTime: "09:00",
  closeTime: "23:00",
  description: "",
};

// ── Utilitaires d'affichage ──────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-vert-projecteur border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isNetwork =
    message.includes("Connexion impossible") || message.includes("WildFly") || message.includes("Failed to fetch");
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
      <p className="text-craie/70 text-[11px] leading-relaxed">{message}</p>
      {isNetwork && (
        <div className="text-[10px] text-jaune-carton bg-encre/60 p-2 border border-encre font-mono">
          💡 <strong>Astuce :</strong> Lancez votre serveur WildFly / Java sur le port 8080 pour synchroniser les données réelles avec la base PostgreSQL.
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: IconComponent,
  label,
  value,
  subtext,
  color = "text-vert-projecteur",
}: {
  icon: Icon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono">{label}</div>
        <IconComponent size={20} weight="bold" className={color} />
      </div>
      <div className={`font-mono font-black text-4xl ${color} mb-1`}>{value}</div>
      {subtext && <div className="text-xs text-craie/40 font-mono">{subtext}</div>}
    </div>
  );
}

// ── Composant Principal Contenu ──────────────────────────────────────────────
function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "overview" | "fields" | "bookings" | "matches" | "teams" | null;

  const { user, isAuthenticated, isManager, loading } = useAuth();

  // ── Onglets ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "fields" | "bookings" | "matches" | "teams">(
    tabParam && ["overview", "fields", "bookings", "matches", "teams"].includes(tabParam) ? tabParam : "overview"
  );

  useEffect(() => {
    if (tabParam && ["overview", "fields", "bookings", "matches", "teams"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // ── Données ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [statsLoading, setStatsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // ── Formulaire nouveau terrain ───────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NewFieldForm>(INITIAL_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Filtres réservations ─────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fieldFilter, setFieldFilter] = useState<string>("ALL");

  // ── Notification flash ───────────────────────────────────────────────────
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [s, f] = await Promise.all([
        api<DashboardStats>("/manager/stats", { auth: true }),
        api<Field[]>("/manager/fields", { auth: true }),
      ]);
      setStats(s);
      setFields(f);
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : "Erreur de chargement des statistiques");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const data = await api<Booking[]>("/manager/bookings", { auth: true });
      setBookings(data);
    } catch (err: unknown) {
      setBookingsError(err instanceof Error ? err.message : "Erreur de chargement des réservations");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const data = await getMatches();
      setMatches(data);
    } catch {
      // Ignorer les erreurs non bloquantes
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const data = await getTeams();
      setTeams(data);
    } catch {
      // Ignorer les erreurs non bloquantes
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isManager) {
      fetchStats();
      fetchBookings();
      fetchMatches();
      fetchTeams();
    }
  }, [isAuthenticated, isManager, fetchStats, fetchBookings, fetchMatches, fetchTeams]);

  // ── Actions Gérant ───────────────────────────────────────────────────────
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        fieldType: form.fieldType,
        surfaceType: form.surfaceType,
        capacity: Number(form.capacity),
        pricePerHour: Number(form.pricePerHour),
        currency: form.currency,
        indoor: form.indoor,
        hasLights: form.hasLights,
        hasLockerRoom: form.hasLockerRoom,
        hasParking: form.hasParking,
        openTime: form.openTime,
        closeTime: form.closeTime,
        description: form.description?.trim() || undefined,
      };

      const newField = await api<Field>("/manager/fields", {
        method: "POST",
        auth: true,
        body: payload,
      });

      setFields((prev) => [newField, ...prev]);
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      showNotice(`Terrain "${newField.name}" créé avec succès !`);
      fetchStats();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création du terrain");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleFieldActive = async (fieldId: string, currentActive: boolean) => {
    try {
      const updated = await api<Field>(`/manager/fields/${fieldId}/active`, {
        method: "PATCH",
        auth: true,
        body: { active: !currentActive },
      });
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showNotice(`Terrain "${updated.name}" ${updated.active ? "activé" : "désactivé"}.`);
      fetchStats();
    } catch (err: unknown) {
      showNotice(`Erreur : ${err instanceof Error ? err.message : "Action impossible"}`);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const updated = await api<Booking>(`/manager/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        auth: true,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showNotice(`Réservation #${bookingId.slice(0, 8).toUpperCase()} confirmée !`);
      fetchStats();
    } catch (err: unknown) {
      showNotice(`Erreur : ${err instanceof Error ? err.message : "Impossible de confirmer"}`);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette réservation ?")) return;
    try {
      const updated = await api<Booking>(`/manager/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        auth: true,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      showNotice(`Réservation #${bookingId.slice(0, 8).toUpperCase()} annulée.`);
      fetchStats();
    } catch (err: unknown) {
      showNotice(`Erreur : ${err instanceof Error ? err.message : "Impossible d'annuler"}`);
    }
  };

  // ── Filtrage réservations ────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (fieldFilter !== "ALL" && b.field?.id !== fieldFilter) return false;
    return true;
  });

  // ── Protection d'accès ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !isManager) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
        <div className="border-2 border-encre bg-encre p-8 max-w-md w-full text-center shadow-brutal space-y-4">
          <div className="w-16 h-16 border-2 border-orange-sifflet bg-orange-sifflet/10 flex items-center justify-center mx-auto text-orange-sifflet">
            <Lock size={32} weight="bold" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase text-craie">Accès Réservé</h1>
          <p className="font-mono text-xs text-craie/60">
            Ce tableau de bord est exclusivement accessible aux comptes avec le rôle{" "}
            <span className="text-vert-projecteur font-bold">GÉRANT</span>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth"
              className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-vert-projecteur/80 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/"
              className="border-2 border-encre bg-nuit-pelouse text-craie px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-encre transition-colors"
            >
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse text-craie p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête Dashboard */}
        <div className="border-2 border-encre bg-encre p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 bg-vert-projecteur rounded-full animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-vert-projecteur font-bold">
                Espace Gérant
              </span>
            </div>
            <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-craie">
              Tableau de bord
            </h1>
            <p className="text-craie/50 font-mono text-xs mt-1">
              Connecté en tant que <span className="text-craie font-bold">{user?.email}</span> (Rôle : {user?.role})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchStats();
                fetchBookings();
                fetchMatches();
                fetchTeams();
                showNotice("Données synchronisées !");
              }}
              className="border-2 border-encre bg-nuit-pelouse text-craie px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-encre transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowClockwise size={16} weight="bold" />
              Actualiser
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-5 py-2 font-mono text-xs font-black uppercase shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              Nouveau Terrain
            </button>
          </div>
        </div>

        {/* Notification Flash */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-2 border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur p-3 font-mono text-xs shadow-brutal flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <CheckCircle size={18} weight="bold" />
                {notice}
              </span>
              <button onClick={() => setNotice(null)} className="cursor-pointer hover:text-craie">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barre d'onglets */}
        <div className="flex flex-wrap gap-2 border-b-2 border-encre pb-2 font-mono text-xs">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: ChartBar },
            { id: "fields", label: `Mes Terrains (${fields.length})`, icon: SoccerBall },
            { id: "bookings", label: `Réservations (${bookings.length})`, icon: CalendarCheck },
            { id: "matches", label: `Matchs (${matches.length})`, icon: SoccerBall },
            { id: "teams", label: `Équipes (${teams.length})`, icon: Users },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  router.push(`/dashboard?tab=${tab.id}`, { scroll: false });
                }}
                className={`border-2 border-encre px-4 py-2 font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${isActive
                    ? "bg-vert-projecteur text-encre shadow-brutal -translate-y-0.5"
                    : "bg-encre text-craie/60 hover:text-craie hover:bg-nuit-pelouse"
                  }`}
              >
                <IconComp size={16} weight={isActive ? "fill" : "bold"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── ONGLET 1 : VUE D'ENSEMBLE ────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {statsError && <ErrorBanner message={statsError} onRetry={fetchStats} />}

            {statsLoading ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  icon={SoccerBall}
                  label="Terrains"
                  value={stats?.totalFields ?? fields.length}
                  subtext={`${fields.filter((f) => f.active).length} actifs`}
                  color="text-vert-projecteur"
                />
                <StatCard
                  icon={CurrencyEur}
                  label="Chiffre d'affaires"
                  value={formatPrice(stats?.totalRevenue ?? 0)}
                  subtext="Revenus confirmés"
                  color="text-vert-projecteur"
                />
                <StatCard
                  icon={CalendarCheck}
                  label="Réservations"
                  value={stats?.totalBookings ?? bookings.length}
                  subtext={`${stats?.confirmedBookings ?? bookings.filter((b) => b.status === "CONFIRMED").length} confirmées`}
                  color="text-craie"
                />
                <StatCard
                  icon={Clock}
                  label="En attente"
                  value={stats?.pendingBookings ?? bookings.filter((b) => b.status === "PENDING_PAYMENT").length}
                  subtext="Paiement en cours"
                  color="text-jaune-carton"
                />
                <StatCard
                  icon={SoccerBall}
                  label="Matchs"
                  value={matches.length}
                  subtext={`${matches.filter((m) => m.status === "OPEN").length} ouverts`}
                  color="text-vert-projecteur"
                />
                <StatCard
                  icon={Users}
                  label="Équipes"
                  value={teams.length}
                  subtext={`${teams.filter((t) => t.active).length} actives`}
                  color="text-orange-sifflet"
                />
              </div>
            )}

            {/* Raccourcis rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-encre bg-encre p-6 shadow-brutal flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-xl uppercase text-craie">Ajouter un nouveau terrain</h3>
                  <p className="text-craie/50 font-mono text-xs mt-1">Créez une fiche terrain avec tarifs, horaires et photos.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors cursor-pointer shrink-0"
                >
                  + Ajouter
                </button>
              </div>

              <div className="border-2 border-encre bg-encre p-6 shadow-brutal flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-xl uppercase text-craie">Réservations en attente</h3>
                  <p className="text-craie/50 font-mono text-xs mt-1">
                    {bookings.filter((b) => b.status === "PENDING_PAYMENT").length} réservation(s) nécessitant votre action.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("bookings");
                    setStatusFilter("PENDING_PAYMENT");
                  }}
                  className="border-2 border-orange-sifflet bg-orange-sifflet text-craie px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-vert-projecteur hover:text-encre transition-colors cursor-pointer shrink-0"
                >
                  Voir les attentes
                </button>
              </div>
            </div>

            {/* Aperçu Matchs & Équipes dans Vue d'ensemble */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Derniers Matchs */}
              <div className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-encre/60">
                  <div className="flex items-center gap-2">
                    <SoccerBall size={20} className="text-vert-projecteur" />
                    <h3 className="font-display font-black text-lg text-craie uppercase">
                      Matchs récents ({matches.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("matches")}
                    className="font-mono text-xs text-vert-projecteur hover:underline font-bold"
                  >
                    Voir tout →
                  </button>
                </div>

                {matchesLoading ? (
                  <Spinner />
                ) : matches.length === 0 ? (
                  <div className="font-mono text-xs text-craie/40 py-6 text-center">
                    Aucun match en cours ou prévu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="border border-encre bg-nuit-pelouse p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-craie text-sm flex items-center gap-2">
                            <span>{m.title}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 border ${m.status === "OPEN"
                                  ? "border-vert-projecteur text-vert-projecteur"
                                  : "border-craie/40 text-craie/60"
                                }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-craie/50 mt-0.5">
                            {m.field?.name ?? "Terrain"} • {formatDate(m.matchDate)} {formatTime(m.matchDate)}
                          </div>
                        </div>
                        <Link
                          href={`/matches/${m.id}`}
                          className="border border-encre px-2 py-1 font-mono text-[11px] hover:border-vert-projecteur hover:text-vert-projecteur transition-colors shrink-0"
                        >
                          Détails
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dernières Équipes */}
              <div className="border-2 border-encre bg-encre p-6 shadow-brutal space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-encre/60">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-orange-sifflet" />
                    <h3 className="font-display font-black text-lg text-craie uppercase">
                      Équipes déclarées ({teams.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("teams")}
                    className="font-mono text-xs text-orange-sifflet hover:underline font-bold"
                  >
                    Voir tout →
                  </button>
                </div>

                {teamsLoading ? (
                  <Spinner />
                ) : teams.length === 0 ? (
                  <div className="font-mono text-xs text-craie/40 py-6 text-center">
                    Aucune équipe déclarée pour l&apos;instant.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teams.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className="border border-encre bg-nuit-pelouse p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-encre bg-encre flex items-center justify-center font-display font-black text-orange-sifflet text-sm">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-craie text-sm">{t.name}</div>
                            <div className="font-mono text-[11px] text-craie/50">
                              {t.members?.length ?? 0}/{t.maxMembers ?? 10} membres • {(t.members?.length ?? 0) < (t.maxMembers ?? 10) ? "Recrute" : "Complet"}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/equipes/${t.id}`}
                          className="border border-encre px-2 py-1 font-mono text-[11px] hover:border-orange-sifflet hover:text-orange-sifflet transition-colors shrink-0"
                        >
                          Voir l&apos;équipe
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET 2 : MES TERRAINS ─────────────────────────────────────────── */}
        {activeTab === "fields" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-black text-2xl uppercase text-craie flex items-center gap-2">
                <SoccerBall size={24} className="text-vert-projecteur" />
                Gestion des Terrains ({fields.length})
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-black uppercase shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} weight="bold" /> Nouveau terrain
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal space-y-4">
                <SoccerBall size={48} className="mx-auto text-craie/30" />
                <h3 className="font-display font-black text-xl uppercase text-craie">
                  Vous n&apos;avez aucun terrain enregistré
                </h3>
                <p className="font-mono text-xs text-craie/50 max-w-md mx-auto">
                  Créez votre première fiche terrain pour permettre aux joueurs de réserver des créneaux en ligne.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-6 py-2.5 font-mono text-xs font-bold uppercase shadow-brutal cursor-pointer"
                >
                  Ajouter mon premier terrain
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((f) => (
                  <div key={f.id} className="border-2 border-encre bg-encre shadow-brutal flex flex-col justify-between">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`w-2 h-2 rounded-full ${f.active ? "bg-vert-projecteur" : "bg-orange-sifflet"
                                }`}
                            />
                            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-craie/60">
                              {f.active ? "Actif & Réservable" : "Désactivé"}
                            </span>
                          </div>
                          <h3 className="font-display font-black text-xl text-craie uppercase">{f.name}</h3>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-2 border-encre bg-nuit-pelouse text-craie font-mono">
                          {formatFieldType(f.fieldType)}
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-xs text-craie/70 border-t border-encre/60 pt-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-vert-projecteur shrink-0" />
                          <span className="truncate">
                            {f.city} {f.address ? `• ${f.address}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-vert-projecteur shrink-0" />
                          <span>{formatWorkingHours(f.openTime, f.closeTime)}</span>
                        </div>
                        {f.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-vert-projecteur shrink-0" />
                            <span>{f.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {f.hasLights && (
                          <span className="text-[10px] font-mono border border-encre px-2 py-0.5 bg-nuit-pelouse text-craie/80">
                            Éclairage
                          </span>
                        )}
                        {f.indoor && (
                          <span className="text-[10px] font-mono border border-encre px-2 py-0.5 bg-nuit-pelouse text-craie/80">
                            Couvert
                          </span>
                        )}
                        {f.hasLockerRoom && (
                          <span className="text-[10px] font-mono border border-encre px-2 py-0.5 bg-nuit-pelouse text-craie/80">
                            Vestiaires
                          </span>
                        )}
                        {f.hasParking && (
                          <span className="text-[10px] font-mono border border-encre px-2 py-0.5 bg-nuit-pelouse text-craie/80">
                            Parking
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t-2 border-encre bg-nuit-pelouse p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono font-black text-lg text-vert-projecteur">
                          {formatPrice(f.pricePerHour, f.currency)}
                        </div>
                        <div className="font-mono text-[10px] text-craie/40 uppercase">par heure</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/terrains/${f.id}`}
                          className="border border-encre bg-encre text-craie hover:border-vert-projecteur px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors"
                        >
                          Voir
                        </Link>
                        <button
                          onClick={() => handleToggleFieldActive(f.id, f.active)}
                          className={`border px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${f.active
                              ? "border-orange-sifflet/60 text-orange-sifflet hover:bg-orange-sifflet hover:text-craie"
                              : "border-vert-projecteur/60 text-vert-projecteur hover:bg-vert-projecteur hover:text-encre"
                            }`}
                        >
                          {f.active ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 3 : RÉSERVATIONS ────────────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookingsError && <ErrorBanner message={bookingsError} onRetry={fetchBookings} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-encre bg-encre p-4 shadow-brutal">
              {/* Filtres de statut */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-xs uppercase text-craie/50 mr-2 flex items-center gap-1">
                  <SlidersHorizontal size={14} /> Statut :
                </span>
                {["ALL", "PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`border px-3 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${statusFilter === st
                        ? "border-vert-projecteur bg-vert-projecteur text-encre"
                        : "border-encre bg-nuit-pelouse text-craie/60 hover:text-craie"
                      }`}
                  >
                    {st === "ALL"
                      ? "Toutes"
                      : st === "PENDING_PAYMENT"
                        ? "En attente"
                        : st === "CONFIRMED"
                          ? "Confirmées"
                          : st === "CANCELLED"
                            ? "Annulées"
                            : "Terminées"}
                  </button>
                ))}
              </div>

              {/* Filtre par terrain */}
              {fields.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-craie/50">Terrain :</span>
                  <select
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="border-2 border-encre bg-nuit-pelouse text-craie px-3 py-1 text-xs font-mono outline-none"
                  >
                    <option value="ALL">Tous les terrains</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {bookingsLoading ? (
              <Spinner />
            ) : filteredBookings.length === 0 ? (
              <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal font-mono text-xs text-craie/40">
                Aucune réservation ne correspond à ces critères.
              </div>
            ) : (
              <div className="border-2 border-encre bg-encre overflow-x-auto shadow-brutal">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-encre bg-nuit-pelouse text-craie/50 font-mono text-[11px] uppercase tracking-wider">
                      <th className="p-3">Réf Billet</th>
                      <th className="p-3">Terrain</th>
                      <th className="p-3">Joueur / Client</th>
                      <th className="p-3">Date & Heure</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions Gérant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre/60 font-mono text-xs">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-nuit-pelouse/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-jaune-carton">
                          #{b.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3 font-bold text-craie">
                          {b.field?.name ?? "Terrain"}
                          <div className="text-[10px] text-craie/40">{b.field?.city}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-craie font-bold">
                            {b.user ? `${b.user.firstName} ${b.user.lastName}` : "Client Anonyme"}
                          </div>
                          <div className="text-[10px] text-craie/50">{b.user?.email}</div>
                          {b.user?.phone && <div className="text-[10px] text-craie/40">{b.user.phone}</div>}
                        </td>
                        <td className="p-3 text-craie/70">
                          <div>{formatDate(b.startAt)}</div>
                          <div className="text-vert-projecteur font-bold">
                            {formatTime(b.startAt)} - {formatTime(b.endAt)}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-vert-projecteur">{formatPrice(b.totalAmount)}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${b.status === "CONFIRMED" || b.status === "COMPLETED"
                                ? "border-vert-projecteur bg-vert-projecteur/10 text-vert-projecteur"
                                : b.status === "PENDING_PAYMENT"
                                  ? "border-jaune-carton bg-jaune-carton/10 text-jaune-carton"
                                  : "border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet"
                              }`}
                          >
                            {b.status === "CONFIRMED"
                              ? "Confirmée"
                              : b.status === "PENDING_PAYMENT"
                                ? "En attente"
                                : b.status === "CANCELLED"
                                  ? "Annulée"
                                  : b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === "PENDING_PAYMENT" && (
                              <button
                                onClick={() => handleConfirmBooking(b.id)}
                                className="border border-vert-projecteur bg-vert-projecteur text-encre px-2 py-1 font-mono text-[10px] font-bold uppercase hover:bg-vert-projecteur/80 cursor-pointer"
                              >
                                Valider
                              </button>
                            )}
                            {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="border border-orange-sifflet text-orange-sifflet px-2 py-1 font-mono text-[10px] font-bold uppercase hover:bg-orange-sifflet hover:text-craie cursor-pointer"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 4 : MATCHS ──────────────────────────────────────────────── */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-2xl uppercase text-craie flex items-center gap-2">
                  <SoccerBall size={24} className="text-vert-projecteur" />
                  Matchs & Tournois ({matches.length})
                </h2>
                <p className="font-mono text-xs text-craie/50">
                  Visualisez les rencontres amicales ou compétitives organisées sur les terrains.
                </p>
              </div>
              <Link
                href="/matches"
                className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-black uppercase shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} weight="bold" /> Créer un match
              </Link>
            </div>

            {matchesLoading ? (
              <Spinner />
            ) : matches.length === 0 ? (
              <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal space-y-4">
                <SoccerBall size={48} className="mx-auto text-craie/30" />
                <h3 className="font-display font-black text-xl uppercase text-craie">Aucun match créé</h3>
                <p className="font-mono text-xs text-craie/50 max-w-md mx-auto">
                  Aucun match n&apos;a encore été programmé. Lancez un match pour trouver des joueurs !
                </p>
                <Link
                  href="/matches"
                  className="inline-flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-6 py-2.5 font-mono text-xs font-bold uppercase shadow-brutal"
                >
                  Programmer un match
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((m) => {
                  const pCount = m.participants?.length ?? 0;
                  const max = m.maxPlayers ?? 10;
                  const isFull = pCount >= max;
                  return (
                    <div
                      key={m.id}
                      className="border-2 border-encre bg-encre p-5 shadow-brutal flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${m.status === "OPEN" && !isFull
                                ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                                : isFull
                                  ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                                  : "border-craie/40 text-craie/60"
                              }`}
                          >
                            {isFull ? "COMPLET" : m.status}
                          </span>
                          <span className="font-mono text-xs text-craie/60">
                            {pCount} / {max} joueurs
                          </span>
                        </div>

                        <h3 className="font-display font-black text-xl text-craie uppercase mb-2 line-clamp-1">
                          {m.title}
                        </h3>

                        <div className="space-y-1 font-mono text-xs text-craie/70 border-t border-encre/60 pt-3">
                          <div className="flex items-center gap-1.5 text-vert-projecteur">
                            <Clock size={14} />
                            <span>
                              {formatDate(m.matchDate)} • {formatTime(m.matchDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-craie/50" />
                            <span className="truncate">{m.field?.name ?? "Terrain réservé"}</span>
                          </div>
                          {m.field?.fieldType && (
                            <div className="text-[10px] text-craie/40 uppercase">
                              Format : {formatFieldType(m.field.fieldType)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-encre flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-jaune-carton">
                          {m.durationMinutes} minutes
                        </span>
                        <Link
                          href={`/matches/${m.id}`}
                          className="border border-vert-projecteur bg-vert-projecteur text-encre px-3 py-1 font-mono text-xs font-bold uppercase hover:bg-vert-projecteur/80 transition-colors"
                        >
                          Voir match →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 5 : ÉQUIPES ─────────────────────────────────────────────── */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-2xl uppercase text-craie flex items-center gap-2">
                  <Users size={24} className="text-orange-sifflet" />
                  Équipes & Clubs ({teams.length})
                </h2>
                <p className="font-mono text-xs text-craie/50">
                  Consultez la liste des clubs et équipes déclarés par les joueurs.
                </p>
              </div>
              <Link
                href="/equipes"
                className="border-2 border-orange-sifflet bg-orange-sifflet text-craie px-4 py-2 font-mono text-xs font-black uppercase shadow-brutal hover:bg-vert-projecteur hover:text-encre transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} weight="bold" /> Créer une équipe
              </Link>
            </div>

            {teamsLoading ? (
              <Spinner />
            ) : teams.length === 0 ? (
              <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal space-y-4">
                <Users size={48} className="mx-auto text-craie/30" />
                <h3 className="font-display font-black text-xl uppercase text-craie">Aucune équipe enregistrée</h3>
                <p className="font-mono text-xs text-craie/50 max-w-md mx-auto">
                  Aucun club n&apos;a encore été créé. Lancez votre propre équipe !
                </p>
                <Link
                  href="/equipes"
                  className="inline-flex items-center gap-2 border-2 border-orange-sifflet bg-orange-sifflet text-craie px-6 py-2.5 font-mono text-xs font-bold uppercase shadow-brutal"
                >
                  Créer un club
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((t) => {
                  const isRecruiting = (t.members?.length ?? 0) < (t.maxMembers ?? 10);
                  return (
                    <div
                      key={t.id}
                      className="border-2 border-encre bg-encre p-5 shadow-brutal flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${isRecruiting
                                ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                                : "border-craie/40 text-craie/60"
                              }`}
                          >
                            {isRecruiting ? "Recrutement ouvert" : "Effectif complet"}
                          </span>
                          <span className="font-mono text-xs text-craie/60">
                            {t.members?.length ?? 0} / {t.maxMembers ?? 10} membres
                          </span>
                        </div>

                        <h3 className="font-display font-black text-xl text-craie uppercase mb-1 line-clamp-1">
                          {t.name}
                        </h3>
                        {t.description && (
                          <p className="font-body text-xs text-craie/60 line-clamp-2 mb-3">
                            {t.description}
                          </p>
                        )}

                        <div className="space-y-1 font-mono text-xs text-craie/70 border-t border-encre/60 pt-3">
                          <div className="flex items-center gap-1.5 text-jaune-carton">
                            <Crown size={14} weight="fill" />
                            <span>
                              Capitaine : {t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : "Non spécifié"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-encre flex items-center justify-between">
                        <span className="font-mono text-xs text-craie/40 uppercase">
                          Ville : {t.city || "Maroc"}
                        </span>
                        <Link
                          href={`/equipes/${t.id}`}
                          className="border border-orange-sifflet bg-orange-sifflet text-craie px-3 py-1 font-mono text-xs font-bold uppercase hover:bg-vert-projecteur hover:text-encre transition-colors"
                        >
                          Consulter →
                        </Link>
                      </div>
                    </div>
                );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MODALE CRÉATION TERRAIN ────────────────────────────────────────── */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre/80 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border-2 border-encre bg-encre max-w-2xl w-full shadow-brutal p-6 my-8 space-y-4"
              >
                <div className="flex items-center justify-between border-b-2 border-encre/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkle size={20} className="text-vert-projecteur" />
                    <h2 className="font-display font-black text-2xl uppercase text-craie">
                      Créer un nouveau terrain
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 hover:text-orange-sifflet transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {formError && (
                  <div className="border border-orange-sifflet bg-orange-sifflet/10 text-orange-sifflet p-3 font-mono text-xs">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateField} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nom */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">
                        Nom du terrain *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex : Complexe Atlas 5v5"
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>

                    {/* Ville */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Ville *</label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Ex : Casablanca, Rabat, Marrakech"
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-craie/50">
                      Adresse complète *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Ex : 12 Rue des Stades, Quartier Sportif"
                      className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                    />
                  </div>

                  {/* Téléphone & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Téléphone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Ex : +212 600000000"
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Format *</label>
                      <select
                        value={form.fieldType}
                        onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      >
                        <option value="5v5">Foot à 5 (5v5)</option>
                        <option value="7v7">Foot à 7 (7v7)</option>
                        <option value="8v8">Foot à 8 (8v8)</option>
                        <option value="11v11">Grand terrain (11v11)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Surface *</label>
                      <select
                        value={form.surfaceType}
                        onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      >
                        <option value="Synthétique">Synthétique dernière génération</option>
                        <option value="Pelouse naturelle">Pelouse naturelle</option>
                        <option value="Parquet indoor">Parquet / Futsal</option>
                        <option value="Terre battue">Stabilisé</option>
                      </select>
                    </div>
                  </div>

                  {/* Prix, Capacité, Horaires */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Prix / h (MAD) *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={form.pricePerHour}
                        onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Capacité joueurs</label>
                      <input
                        type="number"
                        min={2}
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Ouverture *</label>
                      <input
                        type="time"
                        required
                        value={form.openTime}
                        onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50">Fermeture *</label>
                      <input
                        type="time"
                        required
                        value={form.closeTime}
                        onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                        className="w-full border-2 border-encre bg-nuit-pelouse text-craie px-3 py-2 font-mono text-xs outline-none focus:border-vert-projecteur"
                      />
                    </div>
                  </div>

                  {/* Équipements inclus */}
                  <div className="space-y-2 pt-2 border-t border-encre/60">
                    <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider block">
                      Équipements & Prestations :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                      {[
                        { key: "hasLights", label: "Éclairage nocturne" },
                        { key: "indoor", label: "Terrain couvert" },
                        { key: "hasLockerRoom", label: "Vestiaires & douches" },
                        { key: "hasParking", label: "Parking sécurisé" },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 border border-encre/80 bg-nuit-pelouse p-2 cursor-pointer hover:border-vert-projecteur"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(form[key as keyof NewFieldForm])}
                            onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                            className="accent-vert-projecteur"
                          />
                          <span className="text-[11px] text-craie/80">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions formulaire */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-encre/60">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setIsModalOpen(false)}
                      disabled={formSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={formSubmitting}
                      className="shadow-brutal"
                    >
                      Créer le terrain
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

// ── Export avec Suspense pour useSearchParams ────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
          <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
            <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
              Chargement de l&apos;espace gérant...
            </div>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
