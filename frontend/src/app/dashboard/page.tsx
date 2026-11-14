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
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatPrice, formatDate, formatTime, formatTime12h, formatWorkingHours } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Field, Booking } from "@/lib/types";

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

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "overview" | "fields" | "bookings" | null;

  const { user, isAuthenticated, isManager, loading } = useAuth();

  // ── Onglets ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "fields" | "bookings">(
    tabParam && ["overview", "fields", "bookings"].includes(tabParam) ? tabParam : "overview"
  );

  useEffect(() => {
    if (tabParam && ["overview", "fields", "bookings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // ── Données ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [statsLoading, setStatsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated && isManager) {
      fetchStats();
      fetchBookings();
    }
  }, [isAuthenticated, isManager, fetchStats, fetchBookings]);

  // ── Actions Gérant ───────────────────────────────────────────────────────

  // 1. Créer un nouveau terrain
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

  // 2. Activer / Désactiver un terrain
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

  // 3. Valider une réservation
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

  // 4. Annuler une réservation
  const handleCancelBooking = async (bookingId: string) => {
    const reason = window.prompt("Motif d'annulation de la réservation :", "Créneau indisponible / maintenance");
    if (reason === null) return;

    try {
      const updated = await api<Booking>(`/manager/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        auth: true,
        body: { reason },
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
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchField = fieldFilter === "ALL" || b.field?.id === fieldFilter;
    return matchStatus && matchField;
  });

  // ── Garde chargement ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
            Vérification des accès gérant...
          </div>
        </div>
      </div>
    );
  }

  // ── Garde accès ───────────────────────────────────────────────────────────
  if (!isAuthenticated || !isManager) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full border-2 border-encre bg-encre p-8 shadow-brutal-xl text-center">
          <div className="inline-flex items-center gap-2 border-2 border-orange-sifflet bg-orange-sifflet text-craie px-3 py-1 font-mono font-bold text-xs uppercase tracking-widest mb-6 shadow-brutal">
            <Lock size={14} weight="bold" />
            Accès Gérant Requis
          </div>
          <div className="w-16 h-16 border-2 border-encre bg-orange-sifflet text-craie flex items-center justify-center mx-auto mb-6 shadow-brutal">
            <ChartBar size={32} weight="fill" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase text-craie mb-3">
            Espace <span className="text-orange-sifflet">Gérant</span>
          </h1>
          <p className="text-craie/70 text-sm font-body mb-8 leading-relaxed">
            Cet espace de gestion de complexe, création de terrains et validation des réservations est réservé aux propriétaires de terrains.
          </p>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/auth?role=manager&redirect=/dashboard")}
              icon={<User size={16} weight="bold" />}
            >
              Se connecter en tant que gérant
            </Button>
            <Button variant="ghost" size="md" className="w-full" onClick={() => router.push("/")}>
              Retour à l&apos;accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-pelouse text-craie py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── HEADER SCOREBOARD GÉRANT ────────────────────────────────────── */}
        <div className="border-2 border-encre bg-encre p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 border border-orange-sifflet bg-orange-sifflet/15 text-orange-sifflet px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest mb-2">
              <ChartBar size={14} weight="bold" />
              Espace Gestion Complexe Sportif
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight text-craie">
              Tableau de bord <span className="text-orange-sifflet">Gérant</span>
            </h1>
            <p className="font-mono text-xs text-craie/50 mt-1">
              Connecté : {user?.firstName} {user?.lastName} {user?.businessName ? `· ${user.businessName}` : ""} ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-black uppercase tracking-wider shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              Nouveau Terrain
            </button>
            <button
              onClick={() => { fetchStats(); fetchBookings(); }}
              className="flex items-center gap-1.5 border-2 border-encre bg-nuit-pelouse px-3 py-2 text-craie/60 hover:border-vert-projecteur hover:text-vert-projecteur cursor-pointer transition-colors font-mono text-xs uppercase font-bold"
              title="Rafraîchir les données"
            >
              <ArrowClockwise size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* ── NOTICE FLASH FEEDBACK ────────────────────────────────────────── */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-2 border-vert-projecteur bg-vert-projecteur/15 text-vert-projecteur px-4 py-3 font-mono text-xs font-bold shadow-brutal flex items-center justify-between"
            >
              <span>{notice}</span>
              <CheckCircle size={18} weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BANNIÈRE ERREUR SERVEUR ──────────────────────────────────────── */}
        {statsError && <ErrorBanner message={statsError} onRetry={() => { fetchStats(); fetchBookings(); }} />}

        {/* ── ONGLETS DE NAVIGATION GÉRANT ─────────────────────────────────── */}
        <div className="border-b-2 border-encre flex gap-2">
          {[
            { id: "overview", label: "Vue d'ensemble", count: null },
            { id: "fields", label: "Mes Terrains", count: fields.length },
            { id: "bookings", label: "Réservations & Planning", count: bookings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal font-black -mb-[2px]"
                  : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
              }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* ── ONGLET 1 : VUE D'ENSEMBLE ────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {statsLoading ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={SoccerBall}
                  label="Mes terrains"
                  value={fields.length}
                  subtext={`${fields.filter((f) => f.active).length} actifs · ${fields.filter((f) => !f.active).length} hors-ligne`}
                  color="text-vert-projecteur"
                />
                <StatCard
                  icon={CurrencyEur}
                  label="Revenus validés"
                  value={formatPrice(stats?.totalRevenue ?? 0)}
                  subtext="Total des paiements"
                  color="text-jaune-carton"
                />
                <StatCard
                  icon={CalendarCheck}
                  label="Réservations"
                  value={bookings.length}
                  subtext={`${bookings.filter((b) => b.status === "CONFIRMED").length} confirmées`}
                  color="text-orange-sifflet"
                />
                <StatCard
                  icon={Clock}
                  label="En attente"
                  value={bookings.filter((b) => b.status === "PENDING_PAYMENT").length}
                  subtext="À confirmer ou refuser"
                  color="text-craie"
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
          </div>
        )}

        {/* ── ONGLET 2 : MES TERRAINS (GESTION & CRÉATION) ─────────────────── */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  Parc de terrains ({fields.length})
                </h2>
                <p className="font-mono text-xs text-craie/50">
                  Gérez vos terrains, modifiez leur statut ou ajoutez un nouveau créneau.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre px-4 py-2 font-mono text-xs font-black uppercase tracking-wider shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                Créer un terrain
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="border-2 border-encre bg-encre p-12 text-center shadow-brutal space-y-4">
                <SoccerBall size={48} weight="fill" className="mx-auto text-vert-projecteur" />
                <h3 className="font-display font-black text-xl uppercase text-craie">
                  Vous n&apos;avez encore aucun terrain enregistré
                </h3>
                <p className="font-mono text-xs text-craie/50 max-w-md mx-auto">
                  Commencez dès maintenant en ajoutant votre premier terrain synthétique ou gazon naturel pour recevoir des réservations.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="border-2 border-vert-projecteur bg-vert-projecteur text-encre px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:bg-orange-sifflet hover:text-craie transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  Créer mon premier terrain
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((f) => (
                  <div key={f.id} className="border-2 border-encre bg-encre shadow-brutal flex flex-col justify-between">
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-black text-xl text-craie uppercase">{f.name}</h3>
                          <span className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} weight="bold" /> {f.city} {f.address ? `· ${f.address}` : ""}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 border font-mono font-bold uppercase ${
                            f.active
                              ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                              : "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                          }`}
                        >
                          {f.active ? "En ligne" : "Hors ligne"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                        <span className="border border-craie/30 px-2 py-0.5 text-craie/80 font-bold">{f.fieldType}</span>
                        <span className="border border-craie/30 px-2 py-0.5 text-craie/80">{f.surfaceType ?? "Synthétique"}</span>
                        <span className="font-bold text-vert-projecteur text-sm">{formatPrice(f.pricePerHour)} / h</span>
                      </div>

                      {/* Horaires de travail */}
                      <div className="flex items-center gap-1.5 text-xs font-mono text-craie/80 bg-nuit-pelouse px-2.5 py-1.5 border border-encre">
                        <Clock size={13} weight="bold" className="text-vert-projecteur shrink-0" />
                        <span>Horaires : <strong className="text-craie">{formatWorkingHours(f.openTime, f.closeTime)}</strong></span>
                      </div>

                      {/* Équipements */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-encre/40 font-mono text-[10px] text-craie/60">
                        {f.hasLights && <span className="bg-nuit-pelouse px-1.5 py-0.5 border border-encre">💡 Éclairage</span>}
                        {f.indoor && <span className="bg-nuit-pelouse px-1.5 py-0.5 border border-encre">🏠 Couvert</span>}
                        {f.hasLockerRoom && <span className="bg-nuit-pelouse px-1.5 py-0.5 border border-encre">🚿 Vestiaires</span>}
                        {f.hasParking && <span className="bg-nuit-pelouse px-1.5 py-0.5 border border-encre">🚗 Parking</span>}
                      </div>
                    </div>

                    <div className="border-t-2 border-encre p-3 bg-nuit-pelouse flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleFieldActive(f.id, f.active)}
                        className={`w-full py-1.5 font-mono text-xs font-bold uppercase border-2 transition-colors cursor-pointer ${
                          f.active
                            ? "border-orange-sifflet text-orange-sifflet hover:bg-orange-sifflet hover:text-craie"
                            : "border-vert-projecteur text-vert-projecteur hover:bg-vert-projecteur hover:text-encre"
                        }`}
                      >
                        {f.active ? "Mettre hors-ligne" : "Activer le terrain"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET 3 : RÉSERVATIONS & PLANNING ───────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Filtres de réservations */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-2 border-encre bg-encre p-4 shadow-brutal">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs uppercase text-craie/50">Statut :</span>
                {["ALL", "PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase border-2 transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "border-orange-sifflet bg-orange-sifflet text-craie"
                        : "border-encre bg-nuit-pelouse text-craie/60 hover:border-craie/40"
                    }`}
                  >
                    {st === "ALL" ? "Toutes" : st === "PENDING_PAYMENT" ? "En attente" : st === "CONFIRMED" ? "Confirmées" : st === "CANCELLED" ? "Annulées" : "Terminées"}
                  </button>
                ))}
              </div>

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
                          <div className="text-vert-projecteur font-bold">{formatTime(b.startAt)} - {formatTime(b.endAt)}</div>
                        </td>
                        <td className="p-3 font-bold text-vert-projecteur">
                          {formatPrice(b.totalAmount)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
                              b.status === "CONFIRMED" || b.status === "COMPLETED"
                                ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                                : b.status === "CANCELLED"
                                ? "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10"
                                : "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {b.status === "PENDING_PAYMENT" && (
                            <>
                              <button
                                onClick={() => handleConfirmBooking(b.id)}
                                className="px-2.5 py-1 bg-vert-projecteur text-encre text-[10px] font-bold uppercase hover:opacity-90 cursor-pointer shadow-brutal"
                                title="Valider la réservation"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="px-2.5 py-1 border border-orange-sifflet text-orange-sifflet text-[10px] font-bold uppercase hover:bg-orange-sifflet hover:text-craie cursor-pointer"
                                title="Refuser la réservation"
                              >
                                Refuser
                              </button>
                            </>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="px-2.5 py-1 border border-orange-sifflet text-orange-sifflet text-[10px] font-bold uppercase hover:bg-orange-sifflet hover:text-craie cursor-pointer"
                            >
                              Annuler
                            </button>
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

        {/* ── MODAL NOUVEAU TERRAIN ────────────────────────────────────────── */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre/80 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl border-2 border-encre bg-encre shadow-brutal-xl p-6 space-y-5 my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b-2 border-encre/60">
                  <div className="flex items-center gap-2">
                    <SoccerBall size={24} weight="bold" className="text-vert-projecteur" />
                    <h2 className="font-display font-black text-2xl uppercase text-craie">
                      Créer un nouveau terrain
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-craie/50 hover:text-craie p-1 cursor-pointer"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                {formError && (
                  <div className="border border-orange-sifflet bg-orange-sifflet/15 text-orange-sifflet p-3 font-mono text-xs">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateField} className="space-y-4">
                  {/* Nom du terrain */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                      Nom du terrain *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Terrain Synthétique 5v5 Principal"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-body"
                    />
                  </div>

                  {/* Ville + Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Casablanca, Rabat, Paris..."
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-body"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Format de jeu *
                      </label>
                      <select
                        value={form.fieldType}
                        onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                      >
                        <option value="5v5">5 contre 5 (Five)</option>
                        <option value="7v7">7 contre 7</option>
                        <option value="11v11">11 contre 11 (Grand terrain)</option>
                      </select>
                    </div>
                  </div>

                  {/* Adresse + Téléphone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Adresse complète
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Boulevard d'Anfa, Ain Diab..."
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-body"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Téléphone contact
                      </label>
                      <input
                        type="tel"
                        placeholder="+212 6 12 34 56 78"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                      />
                    </div>
                  </div>

                  {/* Surface + Prix par heure */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Surface
                      </label>
                      <select
                        value={form.surfaceType}
                        onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                      >
                        <option value="Synthétique">Synthétique dernière génération</option>
                        <option value="Gazon naturel">Gazon naturel</option>
                        <option value="Hybride">Pelouse hybride</option>
                        <option value="Parquet">Parquet intérieur</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Tarif / heure (MAD) *
                      </label>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        required
                        value={form.pricePerHour}
                        onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider">
                        Capacité joueurs max
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="30"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                        className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                      />
                    </div>
                  </div>

                  {/* Horaires d'ouverture / Intervalle de travail */}
                  <div className="space-y-2 pt-2 border-t border-encre/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase text-craie/50 tracking-wider flex items-center gap-1.5">
                        <Clock size={12} className="text-vert-projecteur" weight="bold" />
                        Intervalle de travail (Heures d&apos;ouverture) *
                      </label>
                      <span className="text-[11px] font-mono text-vert-projecteur font-bold">
                        {formatWorkingHours(form.openTime, form.closeTime)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-craie/60">Heure d&apos;ouverture :</span>
                        <input
                          type="time"
                          required
                          value={form.openTime}
                          onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                          className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-craie/60">Heure de fermeture :</span>
                        <input
                          type="time"
                          required
                          value={form.closeTime}
                          onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                          className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-vert-projecteur font-mono"
                        />
                      </div>
                    </div>

                    {/* Presets rapides */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-craie/40 uppercase">Raccourcis :</span>
                      {[
                        { label: "9 AM - 11 PM", open: "09:00", close: "23:00" },
                        { label: "8 AM - 12 AM (Minuit)", open: "08:00", close: "00:00" },
                        { label: "10 AM - 10 PM", open: "10:00", close: "22:00" },
                        { label: "8 AM - 8 PM", open: "08:00", close: "20:00" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setForm({ ...form, openTime: preset.open, closeTime: preset.close })}
                          className={`text-[10px] font-mono px-2 py-0.5 border transition-all ${
                            form.openTime === preset.open && form.closeTime === preset.close
                              ? "bg-vert-projecteur text-encre border-vert-projecteur font-bold"
                              : "border-encre/60 bg-nuit-pelouse text-craie/70 hover:border-craie/40 hover:text-craie"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
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
