"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowClockwise, X, Ticket, Plus, Lock, User, SoccerBall } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getMyBookings, cancelBooking } from "@/services/bookings.service";
import { TicketCard } from "@/components/booking/TicketCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BookingStatus } from "@/lib/types";

const STATUS_TABS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "CONFIRMED", label: "Confirmés" },
  { value: "PENDING_PAYMENT", label: "En attente" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "CANCELLED", label: "Annulés" },
];

function statusToBadge(status: BookingStatus) {
  const map: Record<BookingStatus, "confirmed" | "pending" | "completed" | "cancelled" | "expired"> = {
    CONFIRMED: "confirmed",
    PENDING_PAYMENT: "pending",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
  };
  return map[status] ?? "default";
}

export default function MesReservationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<BookingStatus | "ALL">("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: getMyBookings,
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, "Annulation par l'utilisateur"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      setCancellingId(null);
    },
  });

  // Écran d'attente lors du chargement initial de la session
  if (loading) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4">
        <div className="border-2 border-encre bg-encre p-8 text-center shadow-brutal animate-pulse">
          <div className="font-mono text-sm text-vert-projecteur uppercase tracking-widest">
            Chargement de la session...
          </div>
        </div>
      </div>
    );
  }

  // Écran de garde : Utilisateur non authentifié
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full border-2 border-encre bg-encre p-8 shadow-brutal-xl text-center">
          <div className="inline-flex items-center gap-2 border-2 border-jaune-carton bg-jaune-carton text-encre px-3 py-1 font-mono font-bold text-xs uppercase tracking-widest mb-6 shadow-brutal">
            <Lock size={14} weight="bold" />
            Accès réservé
          </div>

          <div className="w-16 h-16 border-2 border-encre bg-vert-projecteur text-encre flex items-center justify-center mx-auto mb-6 shadow-brutal">
            <Ticket size={32} weight="fill" />
          </div>

          <h1 className="font-display font-black text-3xl uppercase text-craie mb-3">
            Mes <span className="text-vert-projecteur">Réservations</span>
          </h1>

          <p className="text-craie/70 text-sm font-body mb-8 leading-relaxed">
            Vous devez être connecté à votre compte pour consulter vos réservations et accéder à vos billets officiels de match.
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/auth?redirect=/mes-reservations")}
              icon={<User size={16} weight="bold" />}
            >
              Se connecter / Créer un compte
            </Button>

            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => router.push("/terrains")}
            >
              Explorer les terrains
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = activeTab === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  return (
    <div className="min-h-screen bg-nuit-pelouse">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div aria-hidden="true" className="font-display font-black text-vert-projecteur/10 text-[60px] leading-none select-none -mb-2">
            BILLETS
          </div>
          <div className="flex items-end justify-between">
            <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
              Mes <span className="text-vert-projecteur">réservations</span>
            </h1>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/reserver")}
              icon={<Plus size={16} weight="bold" />}
            >
              Réserver
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex-shrink-0 border-2 px-4 py-2 font-mono font-bold text-sm uppercase tracking-widest transition-all ${
                activeTab === value
                  ? "border-vert-projecteur bg-vert-projecteur text-encre shadow-brutal"
                  : "border-craie/20 text-craie/50 hover:border-craie/50"
              }`}
              aria-pressed={activeTab === value}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-2 border-encre h-48 animate-pulse bg-encre/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <Ticket size={64} className="text-craie/20 mx-auto" />
            <div className="font-display font-black text-craie/20 text-5xl uppercase">
              Aucune réservation
            </div>
            <Button variant="primary" onClick={() => router.push("/terrains")}>
              Trouver un terrain
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filtered.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20, rotate: i % 2 === 0 ? -1 : 1 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <TicketCard booking={booking} />

                  {/* Actions */}
                  <div className="flex gap-3 mt-3 justify-end">
                    {booking.status === "CONFIRMED" && (
                      <>
                        {cancellingId === booking.id ? (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm text-craie/60 font-mono">Confirmer l'annulation ?</span>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(booking.id)}
                            >
                              Oui, annuler
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setCancellingId(null)}>
                              Non
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancellingId(booking.id)}
                            className="flex items-center gap-1 text-xs text-craie/40 hover:text-orange-sifflet font-mono uppercase tracking-widest transition-colors"
                            aria-label="Annuler la réservation"
                          >
                            <X size={12} weight="bold" />
                            Annuler
                          </button>
                        )}
                      </>
                    )}
                    {booking.status === "COMPLETED" && (
                      <button
                        onClick={() => router.push(`/reserver?fieldId=${booking.field?.id}`)}
                        className="flex items-center gap-1 text-xs text-vert-projecteur hover:underline font-mono uppercase tracking-widest transition-colors"
                        aria-label="Rebooker ce terrain"
                      >
                        <ArrowClockwise size={12} weight="bold" />
                        Rebook en 1 clic
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

