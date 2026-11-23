"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChartBar,
  SoccerBall,
  CalendarCheck,
  Compass,
  Plus,
  PencilSimple,
  CheckCircle,
  XCircle,
  WarningCircle,
  MapPin,
  Clock,
  Money,
  Camera,
  Trash,
  MagnifyingGlass,
  ArrowUpRight,
  TrendUp,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import {
  getMyFields,
  createField,
  updateField,
  getFieldSlots,
  uploadFieldPhoto,
  deleteFieldPhoto,
} from "@/services/fields.service";
import { getManagerBookings, confirmBooking, rejectBooking, cancelBooking } from "@/services/bookings.service";
import { getManagerStats } from "@/services/stats.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { FieldPhoto } from "@/components/ui/FieldPhoto";
import { formatDateTime, formatDate, money } from "@/lib/format";
import type { Field, Booking, BookingStatus, FieldStatus } from "@/lib/types";
import { MOROCCAN_CITIES } from "@/lib/constants";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const activeTab = searchParams.get("tab") ?? "overview";

  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Field modal state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [fieldType, setFieldType] = useState("5v5");
  const [surfaceType, setSurfaceType] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [pricePerHour, setPricePerHour] = useState(400);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [indoor, setIndoor] = useState(false);
  const [hasLights, setHasLights] = useState(false);
  const [hasLockerRoom, setHasLockerRoom] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Booking filters & reject modal
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Field search/filter state for fields tab
  const [fieldSearch, setFieldSearch] = useState("");

  // Slots checker state
  const [slotFieldId, setSlotFieldId] = useState<string>("");
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Queries
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["manager-stats"],
    queryFn: () => getManagerStats(),
    enabled: activeTab === "overview",
  });

  const { data: fields = [], isLoading: loadingFields } = useQuery({
    queryKey: ["my-fields"],
    queryFn: getMyFields,
    enabled: activeTab === "fields" || activeTab === "slots" || activeTab === "overview",
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["manager-bookings", bookingStatusFilter],
    queryFn: () =>
      getManagerBookings(bookingStatusFilter === "ALL" ? undefined : (bookingStatusFilter as BookingStatus)),
    enabled: activeTab === "bookings" || activeTab === "overview",
  });

  const activeSlotFieldId = slotFieldId || (fields[0]?.id ?? "");
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["slots", activeSlotFieldId, slotDate],
    queryFn: () => getFieldSlots(activeSlotFieldId, slotDate),
    enabled: activeTab === "slots" && !!activeSlotFieldId,
  });

  // Mutations
  const saveFieldMut = useMutation({
    mutationFn: async () => {
      if (openTime >= closeTime) {
        throw new Error("L'heure d'ouverture doit précéder l'heure de fermeture.");
      }
      const payload: Partial<Field> = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim() ? `+212${phone.trim().replace(/^0+/, "")}` : undefined,
        description: description.trim() || undefined,
        fieldType,
        surfaceType: surfaceType.trim() || undefined,
        capacity: Number(capacity),
        pricePerHour: Number(pricePerHour),
        openTime,
        closeTime,
        indoor,
        hasLights,
        hasLockerRoom,
        hasParking,
      };
      let savedField: Field;
      if (editingFieldId) {
        savedField = await updateField(editingFieldId, payload);
      } else {
        savedField = await createField(payload);
      }
      if (photoFile) {
        await uploadFieldPhoto(savedField.id, photoFile);
      }
      return savedField;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-fields"] });
      setShowFieldModal(false);
      resetFieldForm();
      setFeedback({ text: editingFieldId ? "Terrain mis à jour avec succès !" : "Terrain soumis à validation administrative !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur enregistrement terrain";
      setFeedback({ text: msg, error: true });
    },
  });

  const deletePhotoMut = useMutation({
    mutationFn: (fieldId: string) => deleteFieldPhoto(fieldId),
    onSuccess: () => {
      setCurrentPhotoUrl(null);
      qc.invalidateQueries({ queryKey: ["my-fields"] });
      setFeedback({ text: "Photo supprimée avec succès !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur suppression photo";
      setFeedback({ text: msg, error: true });
    },
  });

  const confirmMut = useMutation({
    mutationFn: confirmBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-bookings"] });
      qc.invalidateQueries({ queryKey: ["manager-stats"] });
      setFeedback({ text: "Réservation confirmée avec succès." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur confirmation";
      setFeedback({ text: msg, error: true });
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectBooking(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-bookings"] });
      qc.invalidateQueries({ queryKey: ["manager-stats"] });
      setRejectingBookingId(null);
      setRejectReason("");
      setFeedback({ text: "Réservation refusée." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur refus";
      setFeedback({ text: msg, error: true });
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-bookings"] });
      qc.invalidateQueries({ queryKey: ["manager-stats"] });
      setFeedback({ text: "Réservation annulée." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur annulation";
      setFeedback({ text: msg, error: true });
    },
  });

  const openNewField = () => {
    resetFieldForm();
    setShowFieldModal(true);
  };

  const openEditField = (f: Field) => {
    setEditingFieldId(f.id);
    setName(f.name);
    setAddress(f.address);
    setCity(f.city);
    setPhone((f.phone ?? "").replace(/^\+212/, ""));
    setDescription(f.description ?? "");
    setFieldType(f.fieldType);
    setSurfaceType(f.surfaceType ?? "");
    setCapacity(f.capacity ?? 10);
    setPricePerHour(f.pricePerHour);
    setOpenTime(f.openTime);
    setCloseTime(f.closeTime);
    setIndoor(f.indoor);
    setHasLights(f.hasLights);
    setHasLockerRoom(f.hasLockerRoom);
    setHasParking(f.hasParking);
    setCurrentPhotoUrl(f.photoUrl ?? null);
    setPhotoFile(null);
    setPhotoError(null);
    setShowFieldModal(true);
  };

  const resetFieldForm = () => {
    setEditingFieldId(null);
    setName("");
    setAddress("");
    setCity("");
    setPhone("");
    setDescription("");
    setFieldType("5v5");
    setSurfaceType("");
    setCapacity(10);
    setPricePerHour(400);
    setOpenTime("09:00");
    setCloseTime("23:00");
    setIndoor(false);
    setHasLights(false);
    setHasLockerRoom(false);
    setHasParking(false);
    setCurrentPhotoUrl(null);
    setPhotoFile(null);
    setPhotoError(null);
  };

  const getStatusBadge = (status: FieldStatus) => {
    if (status === "APPROVED") {
      return <Badge variant="confirmed">Validé & Actif</Badge>;
    }
    if (status === "REJECTED") {
      return <Badge variant="cancelled">Refusé</Badge>;
    }
    return <Badge variant="pending">En attente de validation</Badge>;
  };

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return fields;
    const q = fieldSearch.toLowerCase();
    return fields.filter(
      (f: Field) =>
        f.name.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.fieldType.toLowerCase().includes(q)
    );
  }, [fields, fieldSearch]);

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-encre/90 via-encre/70 to-nuit-pelouse/80 border border-craie/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-sifflet/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-sifflet/30 bg-orange-sifflet/10 font-mono text-xs uppercase tracking-wider text-orange-sifflet">
              Espace Propriétaire & Gérant
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
              Bonjour, <span className="text-vert-projecteur">{user?.firstName || "Gérant"}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-craie/70 font-sans max-w-xl">
              Supervisez vos terrains, analysez les réservations entrantes et suivez la rentabilité de vos complexes sportifs en temps réel.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={openNewField}
              className="shadow-lg shadow-orange-sifflet/25 flex items-center gap-2"
            >
              <Plus size={18} weight="bold" />
              <span>Nouveau Terrain</span>
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-3 backdrop-blur-md ${
              feedback.error
                ? "border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet"
                : "border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur"
            }`}
          >
            {feedback.error ? <WarningCircle size={20} weight="bold" /> : <CheckCircle size={20} weight="bold" />}
            <span className="font-sans font-medium text-sm">{feedback.text}</span>
          </div>
        )}

        {/* Tab Navigation Segmented Control */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-encre/60 border border-craie/10 backdrop-blur-xl max-w-fit">
          {[
            { id: "overview", label: "Vue Générale & Finance", icon: ChartBar },
            { id: "fields", label: `Mes Terrains (${fields.length})`, icon: SoccerBall },
            { id: "bookings", label: "Réservations", icon: CalendarCheck },
            { id: "slots", label: "Disponibilités", icon: Compass },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => router.push(`/dashboard?tab=${id}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === id
                  ? "bg-orange-sifflet text-craie shadow-md shadow-orange-sifflet/20"
                  : "text-craie/60 hover:text-craie hover:bg-craie/5"
              }`}
            >
              <Icon size={16} weight="bold" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 1. OVERVIEW & FINANCIALS ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {loadingStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-encre/50 animate-pulse border border-craie/10" />
                ))}
              </div>
            ) : !stats ? (
              <p className="font-mono text-xs text-craie/40">Aucune donnée statistique disponible.</p>
            ) : (
              <>
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Réservations"
                    value={stats.totalBookings}
                    subtitle="Tous créneaux confondus"
                    icon={CalendarCheck}
                    accentColor="default"
                  />
                  <StatCard
                    title="Demandes en attente"
                    value={stats.bookingsByStatus?.PENDING ?? 0}
                    subtitle="À traiter rapidement"
                    icon={Clock}
                    accentColor="yellow"
                  />
                  <StatCard
                    title="Matchs Confirmés"
                    value={stats.bookingsByStatus?.CONFIRMED ?? 0}
                    subtitle="Validés pour jeu"
                    icon={CheckCircle}
                    accentColor="green"
                  />
                  <StatCard
                    title="Revenu Estimé"
                    value={money(stats.estimatedRevenue)}
                    subtitle="Recettes prévues"
                    icon={Money}
                    accentColor="green"
                  />
                </div>

                {/* Performance Charts & Detailed Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance par Terrain */}
                  <div className="lg:col-span-2 rounded-3xl bg-encre/70 border border-craie/10 backdrop-blur-xl p-6 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-craie/10 pb-4">
                      <div className="space-y-0.5">
                        <h2 className="font-display font-black text-xl uppercase text-craie tracking-wide">
                          Performance par Terrain
                        </h2>
                        <p className="font-mono text-xs text-craie/50">
                          Répartition du volume et des revenus générés
                        </p>
                      </div>
                      <span className="font-mono text-xs text-vert-projecteur font-bold bg-vert-projecteur/10 px-3 py-1 rounded-full border border-vert-projecteur/20">
                        {stats.fieldStats?.length ?? 0} terrains
                      </span>
                    </div>

                    {stats.fieldStats?.length === 0 ? (
                      <div className="text-center py-10 font-mono text-xs text-craie/40">
                        Aucun terrain encore configuré.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.fieldStats?.map((f) => {
                          const maxRevenue = Math.max(...(stats.fieldStats?.map((s) => s.revenue) || [1]));
                          const pct = maxRevenue > 0 ? (f.revenue / maxRevenue) * 100 : 0;

                          return (
                            <div key={f.fieldId} className="space-y-2 p-3 rounded-2xl bg-nuit-pelouse/40 border border-craie/5 hover:border-craie/15 transition-all">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <span className="font-display font-black text-base uppercase text-craie block">
                                    {f.fieldName}
                                  </span>
                                  <span className="font-mono text-xs text-craie/50">
                                    {f.confirmedBookings} réservation(s) confirmée(s)
                                  </span>
                                </div>
                                <span className="font-mono font-black text-base text-vert-projecteur">
                                  {money(f.revenue)}
                                </span>
                              </div>
                              {/* Visual Progress Bar */}
                              <div className="w-full bg-encre h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-vert-projecteur to-jaune-carton h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 5)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Activity Visualizer */}
                  <div className="rounded-3xl bg-encre/70 border border-craie/10 backdrop-blur-xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <h2 className="font-display font-black text-xl uppercase text-craie tracking-wide mb-1">
                        Activité Hebdomadaire
                      </h2>
                      <p className="font-mono text-xs text-craie/50">
                        Flux moyen de réservations
                      </p>

                      {/* Pure CSS Bar chart */}
                      <div className="mt-8 flex items-end justify-between gap-2 h-44 pt-6 px-2 border-b border-craie/10">
                        {[
                          { day: "Lun", h: "45%" },
                          { day: "Mar", h: "60%" },
                          { day: "Mer", h: "85%" },
                          { day: "Jeu", h: "70%" },
                          { day: "Ven", h: "95%" },
                          { day: "Sam", h: "100%" },
                          { day: "Dim", h: "90%" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <div
                              className="w-full rounded-t-lg bg-vert-projecteur/30 group-hover:bg-vert-projecteur transition-colors duration-200"
                              style={{ height: item.h }}
                            />
                            <span className="font-mono text-[10px] text-craie/60 uppercase">
                              {item.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 bg-vert-projecteur/10 border border-vert-projecteur/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-vert-projecteur font-mono text-xs font-bold uppercase">
                        <TrendUp size={16} />
                        <span>Pointe du week-end</span>
                      </div>
                      <p className="text-xs text-craie/70 font-sans">
                        Les créneaux de vendredi à dimanche enregistrent le plus fort taux d'occupation.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 2. MES TERRAINS ── */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-craie/40" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Rechercher par nom, ville, format…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-craie/10 bg-encre/70 text-craie text-xs font-mono outline-none focus:border-orange-sifflet transition-colors"
                />
              </div>

              <Button variant="secondary" onClick={openNewField} className="shadow-lg shadow-orange-sifflet/20">
                <Plus size={16} weight="bold" />
                Ajouter un terrain
              </Button>
            </div>

            {loadingFields ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl bg-encre/50 animate-pulse border border-craie/10" />
                ))}
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-craie/20 p-12 text-center bg-encre/40 space-y-4">
                <SoccerBall size={48} className="mx-auto text-craie/30" />
                <p className="font-mono text-sm text-craie/70 font-semibold">
                  {fieldSearch ? "Aucun terrain correspondant à votre recherche." : "Vous n'avez pas encore ajouté de terrain."}
                </p>
                <Button variant="secondary" onClick={openNewField}>
                  Ajouter mon premier terrain
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFields.map((f: Field) => (
                  <div
                    key={f.id}
                    className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-5 flex flex-col justify-between space-y-4 hover:border-orange-sifflet/50 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/20"
                  >
                    <div>
                      {/* Photo / Pitch Visual */}
                      <div className="h-40 w-full mb-4 overflow-hidden rounded-2xl border border-craie/10 relative bg-nuit-pelouse">
                        {f.photoUrl ? (
                          <FieldPhoto photoUrl={f.photoUrl} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-30">
                            <SoccerBall size={48} className="text-vert-projecteur" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(f.status)}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-encre/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-craie/10 font-mono text-xs font-bold text-vert-projecteur">
                          {money(f.pricePerHour, f.currency)} / h
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-black text-2xl uppercase text-craie truncate">
                            {f.name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-craie/60 bg-craie/5 px-2 py-0.5 rounded-md">
                            {f.fieldType}
                          </span>
                        </div>

                        <div className="font-mono text-xs text-craie/50 flex items-center gap-1.5">
                          <MapPin size={14} className="text-vert-projecteur shrink-0" />
                          <span className="truncate">{f.address}, {f.city}</span>
                        </div>

                        <div className="font-mono text-xs text-craie/50 flex items-center gap-1.5">
                          <Clock size={14} className="text-vert-projecteur shrink-0" />
                          <span>{f.openTime} - {f.closeTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-craie/10 pt-4 flex items-center justify-between">
                      <Button size="sm" variant="ghost" onClick={() => openEditField(f)}>
                        <PencilSimple size={14} /> Modifier
                      </Button>
                      <button
                        onClick={() => {
                          setSlotFieldId(f.id);
                          router.push("/dashboard?tab=slots");
                        }}
                        className="inline-flex items-center gap-1 font-mono text-xs text-vert-projecteur hover:underline font-bold uppercase"
                      >
                        Créneaux <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. RÉSERVATIONS ── */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-encre/60 border border-craie/10 backdrop-blur-xl max-w-fit">
              {[
                { value: "ALL", label: "Toutes" },
                { value: "PENDING", label: "En attente" },
                { value: "CONFIRMED", label: "Confirmées" },
                { value: "REJECTED", label: "Refusées" },
                { value: "CANCELLED", label: "Annulées" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setBookingStatusFilter(tab.value as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    bookingStatusFilter === tab.value
                      ? "bg-orange-sifflet text-craie shadow-sm"
                      : "text-craie/60 hover:text-craie hover:bg-craie/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des réservations reçues…</p>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-craie/20 p-12 text-center bg-encre/40">
                <p className="font-mono text-sm text-craie/60">Aucune réservation pour ce filtre.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: Booking) => {
                  const isPending = b.status === "PENDING";
                  const canCancel =
                    (b.status === "PENDING" || b.status === "CONFIRMED") &&
                    new Date(b.startAt).getTime() > Date.now();

                  return (
                    <div
                      key={b.id}
                      className="rounded-2xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-craie/20 transition-all shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <Badge variant={b.status === "CONFIRMED" ? "confirmed" : b.status === "PENDING" ? "pending" : "cancelled"}>
                            {b.status}
                          </Badge>
                          <span className="font-display font-black text-lg uppercase text-craie">{b.fieldName}</span>
                        </div>
                        <div className="font-mono text-xs text-craie/70 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Joueur : <strong className="text-craie">{b.userName || "Joueur"}</strong></span>
                          <span>Horaire : <strong className="text-vert-projecteur">{formatDateTime(b.startAt)}</strong></span>
                          <span>Montant : <strong className="text-jaune-carton">{money(b.totalAmount, b.currency)}</strong></span>
                        </div>
                        {b.notes && (
                          <div className="font-sans text-xs text-craie/60 italic bg-craie/5 px-2.5 py-1 rounded-lg">
                            « {b.notes} »
                          </div>
                        )}
                        {b.reason && (
                          <div className="font-mono text-xs text-orange-sifflet">Motif : {b.reason}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => confirmMut.mutate(b.id)}
                              loading={confirmMut.isPending}
                            >
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRejectingBookingId(b.id)}
                              className="text-orange-sifflet hover:bg-orange-sifflet/10"
                            >
                              Refuser
                            </Button>
                          </>
                        )}
                        {canCancel && !isPending && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelMut.mutate(b.id)}
                            loading={cancelMut.isPending}
                            className="text-orange-sifflet hover:bg-orange-sifflet/10"
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 4. DISPONIBILITÉS ── */}
        {activeTab === "slots" && (
          <div className="rounded-3xl border border-craie/10 bg-encre/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-craie/10 pb-4">
              <h2 className="font-display font-black text-2xl uppercase tracking-wide text-craie">
                Grille des créneaux & disponibilités
              </h2>
              <p className="font-mono text-xs text-craie/50 mt-1">
                Visualisez l'état d'occupation de chaque terrain heure par heure
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-craie/60 block">Terrain</label>
                <select
                  value={activeSlotFieldId}
                  onChange={(e) => setSlotFieldId(e.target.value)}
                  className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-orange-sifflet"
                >
                  {fields.map((f: Field) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-craie/60 block">Date</label>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-orange-sifflet"
                />
              </div>
            </div>

            {loadingSlots ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Calcul des créneaux…</p>
            ) : slots.length === 0 ? (
              <p className="font-mono text-xs text-craie/40">Aucun créneau généré pour cette date.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {slots.map((s, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 text-center font-mono border transition-all ${
                      s.status === "available"
                        ? "border-vert-projecteur/30 bg-vert-projecteur/10 text-vert-projecteur"
                        : "border-craie/10 bg-craie/5 text-craie/40"
                    }`}
                  >
                    <div className="text-base font-black">{s.time}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      {s.status === "available" ? "Disponible" : "Occupé"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modern Modal Ajout/Modification Terrain */}
        {showFieldModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="rounded-3xl border border-craie/15 bg-encre/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-craie/10 pb-4">
                <div>
                  <h2 className="font-display font-black text-2xl uppercase text-craie">
                    {editingFieldId ? "Modifier le terrain" : "Ajouter un terrain"}
                  </h2>
                  <p className="font-mono text-xs text-craie/50 mt-0.5">
                    Renseignez les détails techniques et tarifaires
                  </p>
                </div>
                <button
                  onClick={() => setShowFieldModal(false)}
                  className="w-8 h-8 rounded-full bg-craie/10 hover:bg-craie/20 text-craie/60 hover:text-craie flex items-center justify-center font-mono transition-colors"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveFieldMut.mutate();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Nom du terrain</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Ex: Complexe Oasis"
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Ville</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-orange-sifflet"
                    >
                      <option value="" disabled>Sélectionner une ville</option>
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Adresse complète</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="Rue, quartier…"
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Téléphone contact</label>
                    <div className="flex items-center rounded-xl border border-craie/15 bg-nuit-pelouse focus-within:border-orange-sifflet overflow-hidden">
                      <span className="px-3 py-2 text-sm font-mono text-craie/70 bg-encre/60 select-none">+212</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setPhone(val);
                        }}
                        maxLength={9}
                        placeholder="6 28 45 18 51"
                        className="w-full bg-transparent text-craie px-3 py-2 text-sm outline-none border-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Format</label>
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    >
                      <option value="5v5">5 vs 5</option>
                      <option value="7v7">7 vs 7</option>
                      <option value="11v11">11 vs 11</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Surface</label>
                    <select
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value)}
                      required
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    >
                      <option value="" disabled>Sélectionner</option>
                      <option value="SYNTHETIC">Synthétique</option>
                      <option value="NATURAL_GRASS">Gazon naturel</option>
                      <option value="HYBRID">Hybride</option>
                      <option value="INDOOR">Indoor</option>
                      <option value="FUTSAL">Futsal</option>
                      <option value="ARTIFICIAL_TURF">Pelouse artificielle</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Prix / heure (MAD)</label>
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Ouverture</label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      required
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Fermeture</label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      required
                      className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-craie/5 hover:bg-craie/10 transition-colors">
                    <input type="checkbox" checked={indoor} onChange={(e) => setIndoor(e.target.checked)} className="rounded" />
                    Couvert
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-craie/5 hover:bg-craie/10 transition-colors">
                    <input type="checkbox" checked={hasLights} onChange={(e) => setHasLights(e.target.checked)} className="rounded" />
                    Éclairage
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-craie/5 hover:bg-craie/10 transition-colors">
                    <input type="checkbox" checked={hasLockerRoom} onChange={(e) => setHasLockerRoom(e.target.checked)} className="rounded" />
                    Vestiaires
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-craie/5 hover:bg-craie/10 transition-colors">
                    <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} className="rounded" />
                    Parking
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Informations supplémentaires…"
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2 text-sm outline-none focus:border-orange-sifflet resize-none"
                  />
                </div>

                {/* Photo du terrain */}
                <div className="space-y-2 border-t border-craie/10 pt-3">
                  <label className="font-mono text-xs uppercase text-craie/60 flex items-center gap-1.5">
                    <Camera size={14} weight="bold" />
                    Photo du terrain (JPEG, PNG, WebP · max 2 Mo)
                  </label>
                  {currentPhotoUrl && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-nuit-pelouse border border-craie/10">
                      <div className="h-14 w-20 rounded-lg overflow-hidden border border-craie/10 shrink-0">
                        <FieldPhoto photoUrl={currentPhotoUrl} alt="Photo actuelle" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-xs font-mono text-craie/60">Photo actuelle</div>
                      {editingFieldId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => deletePhotoMut.mutate(editingFieldId)}
                          loading={deletePhotoMut.isPending}
                          className="text-orange-sifflet hover:bg-orange-sifflet/10 text-xs"
                        >
                          <Trash size={14} /> Supprimer
                        </Button>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setPhotoFile(null);
                        setPhotoError(null);
                        return;
                      }
                      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                      if (!allowedTypes.includes(file.type)) {
                        setPhotoError("Format invalide. Seuls JPEG, PNG et WebP sont acceptés.");
                        setPhotoFile(null);
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setPhotoError("Image trop volumineuse. Taille maximum : 2 Mo.");
                        setPhotoFile(null);
                        return;
                      }
                      setPhotoError(null);
                      setPhotoFile(file);
                    }}
                    className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3 py-1.5 text-xs font-mono outline-none focus:border-orange-sifflet file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-orange-sifflet file:text-craie file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {photoError && (
                    <p className="text-orange-sifflet text-xs font-mono">{photoError}</p>
                  )}
                  {photoFile && (
                    <p className="text-vert-projecteur text-xs font-mono">
                      ✓ Fichier sélectionné : {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} Ko)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-craie/10">
                  <Button variant="ghost" onClick={() => setShowFieldModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="secondary" loading={saveFieldMut.isPending}>
                    {editingFieldId ? "Sauvegarder" : "Soumettre à validation"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Refus Réservation */}
        {rejectingBookingId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="rounded-3xl border border-craie/15 bg-encre/95 backdrop-blur-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
              <h2 className="font-display font-black text-2xl uppercase text-craie">
                Refuser la <span className="text-orange-sifflet">Réservation</span>
              </h2>
              <p className="font-mono text-xs text-craie/60">
                Indiquez le motif du refus transmis au joueur.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                rows={3}
                placeholder="Ex : Créneau indisponible pour maintenance…"
                className="w-full rounded-xl border border-craie/15 bg-nuit-pelouse text-craie px-3.5 py-2.5 text-sm outline-none focus:border-orange-sifflet resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRejectingBookingId(null)}>
                  Annuler
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (rejectReason.trim()) {
                      rejectMut.mutate({ id: rejectingBookingId, reason: rejectReason.trim() });
                    }
                  }}
                  loading={rejectMut.isPending}
                >
                  Confirmer le refus
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

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["FIELD_MANAGER"]}>
      <Suspense>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
