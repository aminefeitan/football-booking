"use client";

import { useState, Suspense } from "react";
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
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getMyFields, createField, updateField, getFieldSlots } from "@/services/fields.service";
import { getManagerBookings, confirmBooking, rejectBooking, cancelBooking } from "@/services/bookings.service";
import { getManagerStats } from "@/services/stats.service";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDate, money } from "@/lib/format";
import type { Field, Booking, BookingStatus, FieldStatus } from "@/lib/types";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const activeTab = searchParams.get("tab") ?? "overview";

  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Field modal state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [fieldType, setFieldType] = useState("5v5");
  const [surfaceType, setSurfaceType] = useState("Synthétique");
  const [capacity, setCapacity] = useState(10);
  const [pricePerHour, setPricePerHour] = useState(400);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [indoor, setIndoor] = useState(false);
  const [hasLights, setHasLights] = useState(true);
  const [hasLockerRoom, setHasLockerRoom] = useState(true);
  const [hasParking, setHasParking] = useState(true);

  // Booking filters & reject modal
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
    enabled: activeTab === "fields" || activeTab === "slots",
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["manager-bookings", bookingStatusFilter],
    queryFn: () =>
      getManagerBookings(bookingStatusFilter === "ALL" ? undefined : (bookingStatusFilter as BookingStatus)),
    enabled: activeTab === "bookings",
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
        phone: phone.trim() || undefined,
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
      if (editingFieldId) {
        return updateField(editingFieldId, payload);
      } else {
        return createField(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-fields"] });
      setShowFieldModal(false);
      resetFieldForm();
      setFeedback({ text: editingFieldId ? "Terrain mis à jour !" : "Terrain créé et soumis à validation !" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur enregistrement terrain";
      setFeedback({ text: msg, error: true });
    },
  });

  const confirmMut = useMutation({
    mutationFn: confirmBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-bookings"] });
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
    setPhone(f.phone ?? "");
    setDescription(f.description ?? "");
    setFieldType(f.fieldType);
    setSurfaceType(f.surfaceType ?? "Synthétique");
    setCapacity(f.capacity ?? 10);
    setPricePerHour(f.pricePerHour);
    setOpenTime(f.openTime);
    setCloseTime(f.closeTime);
    setIndoor(f.indoor);
    setHasLights(f.hasLights);
    setHasLockerRoom(f.hasLockerRoom);
    setHasParking(f.hasParking);
    setShowFieldModal(true);
  };

  const resetFieldForm = () => {
    setEditingFieldId(null);
    setName("");
    setAddress("");
    setCity("Casablanca");
    setPhone("");
    setDescription("");
    setFieldType("5v5");
    setSurfaceType("Synthétique");
    setCapacity(10);
    setPricePerHour(400);
    setOpenTime("09:00");
    setCloseTime("23:00");
    setIndoor(false);
    setHasLights(true);
    setHasLockerRoom(true);
    setHasParking(true);
  };

  const getStatusBadge = (status: FieldStatus) => {
    if (status === "APPROVED") {
      return <span className="border border-vert-projecteur/50 text-vert-projecteur bg-vert-projecteur/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">Validé</span>;
    }
    if (status === "REJECTED") {
      return <span className="border border-orange-sifflet/50 text-orange-sifflet bg-orange-sifflet/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">Refusé</span>;
    }
    return <span className="border border-jaune-carton/50 text-jaune-carton bg-jaune-carton/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">En attente</span>;
  };

  return (
    <div className="min-h-screen bg-nuit-pelouse pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-orange-sifflet mb-1">
            Espace Propriétaire & Gérant
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-craie">
            Tableau de <span className="text-orange-sifflet">Bord</span>
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

        {/* Onglets Navigation Gérant */}
        <div className="flex flex-wrap gap-2 border-b-2 border-encre pb-2">
          {[
            { id: "overview", label: "Statistiques", icon: ChartBar },
            { id: "fields", label: "Mes Terrains", icon: SoccerBall },
            { id: "bookings", label: "Réservations", icon: CalendarCheck },
            { id: "slots", label: "Disponibilités", icon: Compass },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => router.push(`/dashboard?tab=${id}`)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                activeTab === id
                  ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
                  : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
              }`}
            >
              <Icon size={16} weight="bold" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 1. STATISTIQUES ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {loadingStats ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Calcul des statistiques agrégées…</p>
            ) : !stats ? (
              <p className="font-mono text-xs text-craie/40">Aucune donnée statistique disponible.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Total Réservations</span>
                    <span className="font-display font-black text-3xl text-craie">{stats.totalBookings}</span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">En attente</span>
                    <span className="font-display font-black text-3xl text-jaune-carton">
                      {stats.bookingsByStatus?.PENDING ?? 0}
                    </span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Confirmées</span>
                    <span className="font-display font-black text-3xl text-vert-projecteur">
                      {stats.bookingsByStatus?.CONFIRMED ?? 0}
                    </span>
                  </div>
                  <div className="border-2 border-encre bg-encre p-4 shadow-brutal">
                    <span className="font-mono text-[10px] text-craie/50 uppercase block">Revenu Estimé (MAD)</span>
                    <span className="font-display font-black text-3xl text-vert-projecteur">
                      {money(stats.estimatedRevenue)}
                    </span>
                  </div>
                </div>

                {/* Détail par terrain */}
                <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-4">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-2">
                    Performance par Terrain
                  </h2>
                  {stats.fieldStats?.length === 0 ? (
                    <p className="font-mono text-xs text-craie/40">Aucun terrain enregistré.</p>
                  ) : (
                    <div className="divide-y divide-encre/60">
                      {stats.fieldStats?.map((f) => (
                        <div key={f.fieldId} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-display font-black text-lg uppercase text-craie block">
                              {f.fieldName}
                            </span>
                            <span className="font-mono text-xs text-craie/40">
                              {f.confirmedBookings} réservation(s) confirmée(s)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-vert-projecteur">
                            {money(f.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 2. MES TERRAINS ── */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="primary" onClick={openNewField} className="shadow-brutal">
                <Plus size={16} weight="bold" />
                Ajouter un terrain
              </Button>
            </div>

            {loadingFields ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement de vos terrains…</p>
            ) : fields.length === 0 ? (
              <div className="border-2 border-dashed border-craie/20 p-12 text-center bg-encre/40 space-y-3">
                <SoccerBall size={48} className="mx-auto text-craie/30" />
                <p className="font-mono text-sm text-craie/70 font-semibold">
                  Vous n'avez pas encore ajouté de terrain.
                </p>
                <Button variant="secondary" onClick={openNewField}>
                  Ajouter mon premier terrain
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((f: Field) => (
                  <div
                    key={f.id}
                    className="border-2 border-encre bg-encre shadow-brutal p-5 flex flex-col justify-between space-y-4 hover:border-orange-sifflet transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {getStatusBadge(f.status)}
                        <span className="font-mono text-xs text-craie/50">{f.fieldType}</span>
                      </div>
                      <h3 className="font-display font-black text-2xl uppercase text-craie truncate">
                        {f.name}
                      </h3>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {f.address}, {f.city}
                      </div>
                      <div className="font-mono text-xs text-craie/50 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {f.openTime} - {f.closeTime}
                      </div>
                      <div className="font-mono text-sm font-bold text-vert-projecteur mt-3">
                        {money(f.pricePerHour, f.currency)} / h
                      </div>
                    </div>

                    <div className="border-t border-encre/60 pt-3 flex items-center justify-between">
                      <Button size="sm" variant="ghost" onClick={() => openEditField(f)}>
                        <PencilSimple size={14} /> Modifier
                      </Button>
                      <button
                        onClick={() => {
                          setSlotFieldId(f.id);
                          router.push("/dashboard?tab=slots");
                        }}
                        className="font-mono text-xs text-vert-projecteur hover:underline font-bold uppercase"
                      >
                        Créneaux →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. RÉSERVATIONS REÇUES ── */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-1.5 border-b-2 border-encre pb-2">
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
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                    bookingStatusFilter === tab.value
                      ? "border-orange-sifflet bg-orange-sifflet text-craie shadow-brutal"
                      : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Chargement des réservations reçues…</p>
            ) : bookings.length === 0 ? (
              <div className="border-2 border-dashed border-craie/20 p-12 text-center bg-encre/40">
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
                      className="border-2 border-encre bg-encre p-4 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 border border-craie/30 uppercase font-bold text-craie">
                            {b.status}
                          </span>
                          <span className="font-mono text-xs font-bold text-craie">{b.fieldName}</span>
                        </div>
                        <div className="font-mono text-xs text-craie/70">
                          Joueur : <span className="font-bold text-craie">{b.userName || "Joueur"}</span> · {formatDateTime(b.startAt)}
                        </div>
                        <div className="font-mono text-xs text-vert-projecteur font-bold">
                          Montant : {money(b.totalAmount, b.currency)}
                        </div>
                        {b.notes && (
                          <div className="font-body text-xs text-craie/50 italic">« {b.notes} »</div>
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
                            className="text-orange-sifflet hover:bg-orange-sifflet/10 border border-orange-sifflet/40"
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
          <div className="border-2 border-encre bg-encre p-5 shadow-brutal space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-craie/70 border-b border-encre/60 pb-2">
              Grille des disponibilités par terrain & date
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-xs uppercase text-craie/60 block">Terrain</label>
                <select
                  value={activeSlotFieldId}
                  onChange={(e) => setSlotFieldId(e.target.value)}
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                >
                  {fields.map((f: Field) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase text-craie/60 block">Date</label>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                />
              </div>
            </div>

            {loadingSlots ? (
              <p className="font-mono text-xs text-craie/40 animate-pulse">Calcul des créneaux…</p>
            ) : slots.length === 0 ? (
              <p className="font-mono text-xs text-craie/40">Aucun créneau généré pour cette date.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                {slots.map((s, idx) => (
                  <div
                    key={idx}
                    className={`border-2 p-2.5 text-center font-mono ${
                      s.status === "available"
                        ? "border-vert-projecteur/40 bg-vert-projecteur/10 text-vert-projecteur"
                        : "border-orange-sifflet/40 bg-orange-sifflet/10 text-orange-sifflet"
                    }`}
                  >
                    <div className="text-sm font-bold">{s.time}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider">
                      {s.status === "available" ? "Libre" : "Occupé"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Ajout/Modification Terrain */}
        {showFieldModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
            <div className="border-2 border-encre bg-encre p-6 shadow-brutal max-w-xl w-full space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-encre/60 pb-3">
                <h2 className="font-display font-black text-2xl uppercase text-craie">
                  {editingFieldId ? "Modifier le terrain" : "Ajouter un terrain"}
                </h2>
                <button onClick={() => setShowFieldModal(false)} className="text-craie/60 hover:text-craie font-mono">
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
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Ville</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="Casablanca"
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
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
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Téléphone contact</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+212 6 00 00 00 00"
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Format</label>
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    >
                      <option value="5v5">5 vs 5</option>
                      <option value="7v7">7 vs 7</option>
                      <option value="11v11">11 vs 11</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Surface</label>
                    <input
                      type="text"
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value)}
                      placeholder="Synthétique"
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Prix / heure (MAD)</label>
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
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
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase text-craie/60 block">Fermeture</label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      required
                      className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={indoor} onChange={(e) => setIndoor(e.target.checked)} />
                    Couvert
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={hasLights} onChange={(e) => setHasLights(e.target.checked)} />
                    Éclairage
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={hasLockerRoom} onChange={(e) => setHasLockerRoom(e.target.checked)} />
                    Vestiaires
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
                    Parking
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase text-craie/60 block">Description (optionnelle)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowFieldModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" loading={saveFieldMut.isPending}>
                    {editingFieldId ? "Sauvegarder" : "Soumettre à validation"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Refus Réservation */}
        {rejectingBookingId && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="border-2 border-encre bg-encre p-6 shadow-brutal max-w-md w-full space-y-4">
              <h2 className="font-display font-black text-2xl uppercase text-craie">
                Refuser la <span className="text-orange-sifflet">Réservation</span>
              </h2>
              <p className="font-mono text-xs text-craie/60">
                Indiquez le motif du refus (créneau indisponible, entretien, météo…).
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                rows={3}
                placeholder="Motif du refus…"
                className="w-full border-2 border-encre/60 bg-nuit-pelouse text-craie px-3 py-2 text-sm outline-none focus:border-orange-sifflet resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRejectingBookingId(null)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
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
