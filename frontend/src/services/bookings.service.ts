import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

export interface CreateBookingRequest {
  fieldId: string;
  startAt: string;
  endAt: string;
  notes?: string;
}

export async function getMyBookings(): Promise<Booking[]> {
  try {
    return await api<Booking[]>("/bookings/me", { auth: true });
  } catch {
    return MOCK_BOOKINGS;
  }
}

export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  return api<Booking>("/bookings", { method: "POST", body: data, auth: true });
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    body: reason ? { reason } : undefined,
    auth: true,
  });
}

