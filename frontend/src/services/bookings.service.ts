import { api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";

export interface CreateBookingData {
  matchId: string;
  fieldId: string;
  notes?: string;
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  return api<Booking>("/bookings", {
    method: "POST",
    body: data,
  });
}

export async function getMyBookings(): Promise<Booking[]> {
  return api<Booking[]>("/bookings/me");
}

export async function getBookingById(id: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}`);
}

export async function getManagerBookings(status?: BookingStatus): Promise<Booking[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return api<Booking[]>(`/bookings/manager${query}`);
}

export async function confirmBooking(id: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/confirm`, {
    method: "PATCH",
  });
}

export async function rejectBooking(id: string, reason: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function cancelBooking(id: string): Promise<Booking> {
  return api<Booking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
  });
}
