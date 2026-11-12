"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Share, CopySimple, Check } from "@phosphor-icons/react";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { SlotBoard } from "@/components/booking/SlotBoard";
import { PitchPicker } from "@/components/booking/PitchPicker";
import { getFieldById } from "@/services/fields.service";
import { createBooking } from "@/services/bookings.service";
import { processPayment } from "@/services/payments.service";
import { MOCK_FIELDS, MOCK_SLOTS } from "@/lib/mock-data";
import { formatPrice, formatFieldType, formatDate } from "@/lib/utils";
import type { Field } from "@/lib/types";

const STEPS = [
  { label: "Terrain", description: "Choisir le terrain" },
  { label: "Créneau", description: "Choisir l'horaire" },
  { label: "Paiement", description: "Confirmer et payer" },
];

const paymentSchema = z.object({
  paymentMethod: z.enum(["CARD", "CASH", "TRANSFER"]),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFieldId = searchParams.get("fieldId") ?? undefined;

  const [step, setStep] = useState(preselectedFieldId ? 1 : 0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(preselectedFieldId);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [bookingId, setBookingId] = useState<string | undefined>();

  const { data: selectedField } = useQuery({
    queryKey: ["field", selectedFieldId],
    queryFn: () => getFieldById(selectedFieldId!),
    enabled: !!selectedFieldId,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: "CARD" },
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      setBookingId(booking.id);
      setStep(3); // success
    },
  });

  const handleFieldSelect = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setStep(1);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const goToPayment = () => {
    if (selectedTime) setStep(2);
  };

  const handlePayment = handleSubmit(async (data) => {
    if (!selectedFieldId || !selectedTime) return;
    const startAt = `${selectedDate}T${selectedTime}:00`;
    const endAtDate = new Date(`${selectedDate}T${selectedTime}:00`);
    endAtDate.setHours(endAtDate.getHours() + 1);
    const endAt = endAtDate.toISOString().slice(0, 19);

    bookingMutation.mutate({
      fieldId: selectedFieldId,
      startAt,
      endAt,
      notes: data.notes,
    });
  });

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const totalAmount = selectedField ? selectedField.pricePerHour * 1 : 0;

  return (
    <div className="min-h-screen bg-nuit-pelouse">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div aria-hidden="true" className="font-display font-black text-vert-projecteur/10 text-[60px] leading-none select-none -mb-2">RÉSERVER</div>
          <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
            Réservation
          </h1>
        </div>

        {/* Stepper */}
        {step < 3 && (
          <div className="mb-10">
            <Stepper steps={STEPS} currentStep={step} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 0: Choisir terrain */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display font-black text-craie uppercase text-2xl">
                    1. Choisir un terrain
                  </h2>
                  <PitchPicker
                    zones={MOCK_FIELDS.slice(0, 3).map((f, i) => ({
                      id: f.id,
                      label: f.name,
                      status: i === 0 ? "available" : i === 1 ? "last_places" : "reserved",
                      x: 10 + i * 135,
                      y: 20,
                      w: 120,
                      h: 100,
                    }))}
                    selectedZone={selectedFieldId}
                    onSelect={handleFieldSelect}
                    className="mb-4"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_FIELDS.slice(0, 4).map((field) => (
                      <button
                        key={field.id}
                        onClick={() => handleFieldSelect(field.id)}
                        className={`border-2 p-4 text-left transition-all ${
                          selectedFieldId === field.id
                            ? "border-vert-projecteur bg-vert-projecteur/10 shadow-brutal-green"
                            : "border-encre/40 hover:border-craie/50"
                        }`}
                      >
                        <div className="font-display font-black text-craie text-lg uppercase">{field.name}</div>
                        <div className="font-mono text-vert-projecteur font-bold">{formatPrice(field.pricePerHour)}/h</div>
                        <div className="text-xs text-craie/50 font-mono mt-1">{field.city} · {formatFieldType(field.fieldType)}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Choisir créneau */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display font-black text-craie uppercase text-2xl">
                    2. Choisir un créneau
                  </h2>
                  {/* Date picker */}
                  <div>
                    <label className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono mb-2 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="border-2 border-encre bg-encre text-craie px-4 py-3 font-mono text-base focus:outline-none focus:border-vert-projecteur w-full md:w-auto"
                      aria-label="Date de réservation"
                    />
                  </div>

                  {/* Slot board */}
                  <SlotBoard
                    slots={MOCK_SLOTS}
                    selectedTime={selectedTime}
                    onSelect={handleTimeSelect}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setStep(0)}>Retour</Button>
                    <Button
                      variant="primary"
                      onClick={goToPayment}
                      disabled={!selectedTime}
                    >
                      Continuer →
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Paiement */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display font-black text-craie uppercase text-2xl">
                    3. Paiement
                  </h2>

                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Méthode de paiement */}
                    <div>
                      <label className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono mb-3 block">
                        Méthode de paiement
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(["CARD", "CASH", "TRANSFER"] as const).map((method) => (
                          <label key={method} className="cursor-pointer">
                            <input type="radio" value={method} {...register("paymentMethod")} className="sr-only" />
                            <div className="border-2 border-encre/40 p-3 text-center font-mono font-bold text-sm uppercase tracking-widest text-craie/60 hover:border-craie transition-colors peer-checked:border-vert-projecteur">
                              {method === "CARD" ? "💳 Carte" : method === "CASH" ? "💵 Espèces" : "🏦 Virement"}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono mb-2 block">
                        Notes (optionnel)
                      </label>
                      <textarea
                        {...register("notes")}
                        rows={3}
                        placeholder="Match entre amis, tournoi…"
                        className="w-full border-2 border-encre/40 bg-encre/30 text-craie px-4 py-3 font-body text-sm focus:outline-none focus:border-vert-projecteur resize-none placeholder-craie/30"
                      />
                    </div>

                    {/* Invite team */}
                    <div className="border-2 border-jaune-carton bg-jaune-carton/10 p-4">
                      <div className="font-bold text-jaune-carton uppercase tracking-widest text-sm mb-2 font-mono">
                        Inviter ton équipe
                      </div>
                      <p className="text-craie/70 text-sm mb-3">Partage ce lien pour que tes coéquipiers puissent rejoindre.</p>
                      <button
                        type="button"
                        onClick={copyInviteLink}
                        className="flex items-center gap-2 border-2 border-jaune-carton text-jaune-carton px-4 py-2 font-bold text-sm uppercase hover:bg-jaune-carton hover:text-encre transition-colors"
                      >
                        {inviteCopied ? <Check size={16} weight="bold" /> : <CopySimple size={16} weight="bold" />}
                        {inviteCopied ? "Lien copié !" : "Copier le lien"}
                      </button>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="ghost" type="button" onClick={() => setStep(1)}>Retour</Button>
                      <Button
                        variant="booking"
                        size="lg"
                        type="submit"
                        loading={bookingMutation.isPending}
                      >
                        Confirmer la réservation
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Success */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="font-display font-black text-vert-projecteur text-7xl">✓</div>
                  <h2 className="font-display font-black text-craie uppercase text-4xl">
                    Réservation <span className="text-vert-projecteur">confirmée</span> !
                  </h2>
                  <p className="text-craie/60">Ton billet a été envoyé par email.</p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button variant="primary" onClick={() => router.push("/mes-reservations")}>
                      Voir mes réservations
                    </Button>
                    <Button variant="ghost" onClick={() => router.push("/")}>
                      Accueil
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky recap */}
          {step < 3 && (
            <div className="lg:col-span-1">
              <div className="sticky top-20 border-2 border-encre bg-encre shadow-brutal-xl p-6 space-y-4">
                <div className="font-display font-black text-craie uppercase text-xl border-b-2 border-encre/50 pb-3">
                  Récapitulatif
                </div>

                {selectedField ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono">Terrain</div>
                      <div className="font-bold text-craie">{selectedField.name}</div>
                      <div className="text-xs text-craie/50 font-mono">{selectedField.city}</div>
                    </div>
                    {selectedDate && (
                      <div>
                        <div className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono">Date</div>
                        <div className="font-mono text-craie text-sm">{formatDate(selectedDate)}</div>
                      </div>
                    )}
                    {selectedTime && (
                      <div>
                        <div className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono">Créneau</div>
                        <div className="font-mono font-bold text-vert-projecteur text-2xl">{selectedTime}</div>
                      </div>
                    )}
                    <div className="border-t-2 border-encre/50 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-craie/60 font-mono text-sm">Total</span>
                        <span className="font-mono font-black text-2xl text-vert-projecteur">
                          {formatPrice(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-craie/40 text-sm font-mono">Sélectionnez un terrain pour voir le récapitulatif.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function ReservationPage() {
  return (
    <Suspense>
      <BookingContent />
    </Suspense>
  );
}

