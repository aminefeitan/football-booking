export type Role = "PLAYER" | "FIELD_MANAGER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
export type FieldStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
export type MatchStatus = "PLANNED" | "FINISHED" | "CANCELLED";
export type TeamRole = "CAPTAIN" | "MEMBER";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Field {
  id: string;
  ownerId?: string;
  ownerName?: string;
  name: string;
  description?: string;
  address: string;
  city: string;
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
  openTime: string;
  closeTime: string;
  status: FieldStatus;
  photoUrl?: string | null;
  reviewedById?: string;
  createdAt?: string;
}

export interface CreateFieldManagerRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CreatedUserResponse {
  user: User;
  temporaryPassword: string;
}

export interface SlotStatus {
  time: string;
  status: "available" | "reserved";
  available?: boolean;
}

export interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: TeamRole;
  joinedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  members?: TeamMember[];
}

export interface TeamSummary {
  id: string;
  name: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedById: string;
  invitedByName?: string;
  status: InvitationStatus;
  createdAt?: string;
}

export interface Match {
  id: string;
  creatorId: string;
  creatorName?: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  startAt: string;
  durationMinutes: number;
  status: MatchStatus;
  createdAt?: string;
}

export interface Booking {
  id: string;
  matchId: string;
  userId: string;
  userName?: string;
  fieldId: string;
  fieldName?: string;
  startAt: string;
  endAt: string;
  totalAmount: number;
  currency: string;
  notes?: string;
  status: BookingStatus;
  handledById?: string;
  handledAt?: string;
  cancelledAt?: string;
  reason?: string;
  createdAt?: string;
}

export interface FieldStatsItem {
  fieldId: string;
  fieldName: string;
  confirmedBookings: number;
  revenue: number;
}

export interface ManagerStats {
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  estimatedRevenue: number;
  fieldStats: FieldStatsItem[];
}

export interface AdminStats {
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  fieldsByStatus: Record<string, number>;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  totalTeams: number;
  totalMatches: number;
}

export interface ApiErrorBody {
  status?: number;
  message?: string;
}
