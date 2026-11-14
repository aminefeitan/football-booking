export type Role = "PLAYER" | "FIELD_MANAGER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  preferredPosition?: string;
  skillLevel?: string;
  city?: string;
  bio?: string;
  available?: boolean;
  businessName?: string;
  taxNumber?: string;
  department?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Field {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  fieldType: string;
  surfaceType?: string;
  capacity?: number;
  pricePerHour: number;
  currency: string;
  indoor: boolean;
  hasLights: boolean;
  hasLockerRoom: boolean;
  hasParking: boolean;
  active: boolean;
  openTime?: string;
  closeTime?: string;
  owner?: User;
}

export interface Booking {
  id: string;
  user?: User;
  field?: Field;
  startAt: string;
  endAt: string;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  notes?: string;
  expiresAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface MatchParticipant {
  id: string;
  user?: User;
  teamSide?: string;
  status?: string;
  joinedAt?: string;
}

export interface Match {
  id: string;
  organizer?: User;
  booking?: Booking;
  field?: Field;
  title: string;
  description?: string;
  matchDate: string;
  durationMinutes: number;
  maxPlayers?: number;
  status: string;
  public?: boolean;
  isPublic?: boolean;
  city?: string;
  participants?: MatchParticipant[];
}

export interface TeamMember {
  id: string;
  user?: User;
  role: string;
  position?: string;
  joinedAt?: string;
}

export interface Team {
  id: string;
  creator?: User;
  name: string;
  description?: string;
  city?: string;
  maxMembers: number;
  active: boolean;
  members?: TeamMember[];
}

export interface TeamInvitation {
  id: string;
  team?: Team;
  invitedUser?: User;
  invitedBy?: User;
  status: string;
  createdAt?: string;
}

export interface Payment {
  id: string;
  user?: User;
  booking?: Booking;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionRef?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface Player extends User {
  preferredPosition?: string;
  skillLevel?: string;
  city?: string;
  bio?: string;
  available?: boolean;
}

export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
}
