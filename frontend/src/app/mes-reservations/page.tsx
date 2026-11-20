"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  CheckCircle,
  WarningCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getMyBookings, cancelBooking } from "@/services/bookings.service";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDate, money } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";

const TABS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "REJECTED", label: "Refusées" },
  { value: "CANCELLED", label: "Annulées" },
];

export default function MesReservationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<BookingStatus | "ALL">("ALL");
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const cancelMut = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      setFeedback({ text: "Réservation annulée avec succès." });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'annulation.";
      setFeedback({ text: msg, error: true });
    },
  });

  const filteredBookings = bookings.filter((b: Booking) => {
    if (activeTab === "ALL") return true;
    return b.status === activeTab;
  });

  return (
    <ProtectedRoute allowedRoles={["PLAYER"]}>
      <div className="min-h-screen bg-nuit-pelouse pb-20">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-vert-projecteur mb-1">
                Historique des réservations
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-craie">
                Mes <span className="text-vert-projecteur">Réservations</span>
              </h1>
            </div>
            <Link
              href="/matches"
              className="px-4 py-2 border-2 border-vert-projecteur bg-vert-projecteur text-encre font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:bg-vert-projecteur/90 transition-colors shrink-0"
            >
              Nouveau Match & Réservation
            </Link>
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

          {/* Onglets Filtres */}
          <div className="flex flex-wrap gap-1.5 border-b-2 border-encre pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                  activeTab === tab.value
                    ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                    : "border-transparent text-craie/60 hover:text-craie hover:bg-encre"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {isLoading ? (
            <div className="text-center py-12 font-mono text-sm text-craie/40 animate-pulse">
              Chargement de vos réservations…
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="border-2 border-dashed border-craie/20 p-12 text-center bg-encre/40 space-y-3">
              <Ticket size={48} className="mx-auto text-craie/30" />
              <p className="font-mono text-sm text-craie/70 font-semibold">
                Aucune réservation trouvée dans cette catégorie.
              </p>
              <Link
                href="/terrains"
                className="inline-block font-mono text-xs font-bold uppercase text-vert-projecteur hover:underline"
              >
                Explorer les terrains disponibles →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b: Booking) => {
                const canCancel =
                  (b.status === "PENDING" || b.status === "CONFIRMED") &&
                  new Date(b.startAt).getTime() > Date.now();

                const statusColor =
                  b.status === "CONFIRMED"
                    ? "border-vert-projecteur text-vert-projecteur bg-vert-projecteur/10"
                    : b.status === "PENDING"
                    ? "border-jaune-carton text-jaune-carton bg-jaune-carton/10"
                    : "border-orange-sifflet text-orange-sifflet bg-orange-sifflet/10";

                const statusLabel =
                  b.status === "CONFIRMED"
                    ? "Confirmée"
                    : b.status === "PENDING"
                    ? "En attente"
                    : b.status === "REJECTED"
                    ? "Refusée"
                    : "Annulée";

                return (
                  <div
                    key={b.id}
                    className="border-2 border-encre bg-encre shadow-brutal p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] px-2 py-0.5 border font-bold uppercase ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className="font-mono text-xs text-craie/40">
                          Demande du {formatDate(b.createdAt)}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-2xl uppercase text-craie">
                        {b.fieldName || "Terrain de football"}
                      </h3>

                      <div className="flex flex-wrap gap-4 font-mono text-xs text-craie/70">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-vert-projecteur" />
                          {formatDateTime(b.startAt)}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-craie">
                          Montant : {money(b.totalAmount, b.currency)}
                        </span>
                      </div>

                      {b.notes && (
                        <p className="font-body text-xs text-craie/50 italic">
                          Notes : « {b.notes} »
                        </p>
                      )}

                      {b.reason && (
                        <p className="font-mono text-xs text-orange-sifflet">
                          Motif : {b.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMut.mutate(b.id)}
                          loading={cancelMut.isPending}
                          className="text-orange-sifflet hover:bg-orange-sifflet/10 border border-orange-sifflet/40"
                        >
                          Annuler la réservation
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
