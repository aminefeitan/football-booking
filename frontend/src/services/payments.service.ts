import { api } from "@/lib/api";
import type { Payment } from "@/lib/types";
import { MOCK_PAYMENTS } from "@/lib/mock-data";

export interface CreatePaymentRequest {
  bookingId: string;
  paymentMethod: "CARD" | "CASH" | "TRANSFER";
}

export async function getMyPayments(): Promise<Payment[]> {
  try {
    return await api<Payment[]>("/payments/my", { auth: true });
  } catch {
    return MOCK_PAYMENTS;
  }
}

export async function processPayment(data: CreatePaymentRequest): Promise<Payment> {
  return api<Payment>("/payments", { method: "POST", body: data, auth: true });
}

