"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  WarningCircle,
  SoccerBall,
  Plus,
} from "@phosphor-icons/react";
import { useAuth, ProtectedRoute } from "@/context/AuthContext";
import { getMyBookings, cancelBooking } from "@/services/bookings.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

  const { data: bookings = [], isLoading } = useQuery({
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
      <div className="min-h-screen bg-nuit-pelouse pb-24 text-craie">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vert-projecteur bg-vert-projecteur/10 px-3 py-1 rounded-full border border-vert-projecteur/20">
                Historique des réservations
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-craie">
                Mes <span className="text-vert-projecteur">Réservations</span>
              </h1>
            </div>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vert-projecteur text-encre font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-vert-projecteur/20 hover:bg-vert-projecteur/90 transition-all shrink-0"
            >
              <Plus size={16} weight="bold" />
              <span>Nouveau Match</span>
            </Link>
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
              <span className="font-sans text-sm">{feedback.text}</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-encre/60 border border-craie/10 backdrop-blur-xl max-w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab.value
                    ? "bg-vert-projecteur text-encre shadow-sm"
                    : "text-craie/60 hover:text-craie hover:bg-craie/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {isLoading ? (
            <div className="text-center py-16 font-mono text-sm text-craie/40 animate-pulse">
              Chargement de vos réservations…
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-craie/20 p-16 text-center bg-encre/40 space-y-4">
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

                return (
                  <div
                    key={b.id}
                    className="rounded-3xl border border-craie/10 bg-encre/80 backdrop-blur-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-craie/20 transition-all shadow-xl shadow-black/10"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant={
                            b.status === "CONFIRMED"
                              ? "confirmed"
                              : b.status === "PENDING"
                              ? "pending"
                              : "cancelled"
                          }
                        >
                          {b.status === "CONFIRMED"
                            ? "Confirmée"
                            : b.status === "PENDING"
                            ? "En attente"
                            : b.status === "REJECTED"
                            ? "Refusée"
                            : "Annulée"}
                        </Badge>
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
                        <p className="font-sans text-xs text-craie/50 italic">
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
                          className="text-orange-sifflet hover:bg-orange-sifflet/10 border border-orange-sifflet/30"
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
