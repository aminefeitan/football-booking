-- ============================================================================
-- schema.sql
-- Football Booking Application — Complete Database Schema (From Scratch)
-- PostgreSQL 14+ with uuid-ossp and btree_gist extensions
-- ============================================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==================== ENUM TYPES ====================
CREATE TYPE user_role AS ENUM ('PLAYER', 'FIELD_MANAGER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'SUSPENDED');
CREATE TYPE booking_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- ==================== IMPLICIT ENUM CASTS ====================
-- Required for Hibernate/JPA to bind VARCHAR parameters directly to PostgreSQL enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'user_role') THEN
        CREATE CAST (varchar AS user_role) WITH INOUT AS IMPLICIT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'user_status') THEN
        CREATE CAST (varchar AS user_status) WITH INOUT AS IMPLICIT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'booking_status') THEN
        CREATE CAST (varchar AS booking_status) WITH INOUT AS IMPLICIT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'payment_status') THEN
        CREATE CAST (varchar AS payment_status) WITH INOUT AS IMPLICIT;
    END IF;
END $$;

-- ==================== 1. USERS (Table mère pour l'héritage polymorphique) ====================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    role            user_role NOT NULL DEFAULT 'PLAYER',
    status          user_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ==================== 2. PLAYERS (Hérite de users - JOINED) ====================
CREATE TABLE players (
    id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_position  VARCHAR(50),
    skill_level         VARCHAR(20),
    city                VARCHAR(100),
    bio                 TEXT,
    available           BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_players_city ON players(city);

-- ==================== 3. FIELD MANAGERS (Hérite de users - JOINED) ====================
CREATE TABLE field_managers (
    id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name       VARCHAR(200),
    tax_number          VARCHAR(100)
);

-- ==================== 4. ADMINS (Hérite de users - JOINED) ====================
CREATE TABLE admins (
    id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department          VARCHAR(100)
);

-- ==================== 5. FIELDS (Terrains de football) ====================
CREATE TABLE fields (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    address             VARCHAR(500),
    city                VARCHAR(100),
    postal_code         VARCHAR(20),
    latitude            NUMERIC(10, 7),
    longitude           NUMERIC(10, 7),
    phone               VARCHAR(20),
    field_type          VARCHAR(10) NOT NULL DEFAULT '5v5', -- 5v5, 7v7, 11v11
    surface_type        VARCHAR(50),                         -- Synthétique, Gazon naturel, Hybride
    capacity            INT,
    price_per_hour      NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    indoor              BOOLEAN NOT NULL DEFAULT false,
    has_lights          BOOLEAN NOT NULL DEFAULT false,
    has_locker_room     BOOLEAN NOT NULL DEFAULT false,
    has_parking         BOOLEAN NOT NULL DEFAULT false,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fields_city ON fields(city);
CREATE INDEX idx_fields_owner ON fields(owner_id);
CREATE INDEX idx_fields_active ON fields(active) WHERE active = true;

-- ==================== 6. BOOKINGS (Réservations) ====================
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    field_id            UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    start_at            TIMESTAMPTZ NOT NULL,
    end_at              TIMESTAMPTZ NOT NULL,
    total_amount        NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    status              booking_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    notes               TEXT,
    expires_at          TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_booking_times CHECK (start_at < end_at),
    CONSTRAINT chk_booking_duration CHECK (end_at - start_at <= INTERVAL '4 hours')
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_field ON bookings(field_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings(field_id, start_at, end_at);

-- Contrainte d'exclusion : empêche les chevauchements de réservations actives pour le même terrain
ALTER TABLE bookings
    ADD CONSTRAINT excl_booking_no_overlap
    EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    )
    WHERE (status IN ('PENDING_PAYMENT', 'CONFIRMED'));

-- ==================== 7. PAYMENTS (Paiements) ====================
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount              NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    status              payment_status NOT NULL DEFAULT 'PENDING',
    payment_method      VARCHAR(50),
    transaction_ref     VARCHAR(255),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ==================== 8. TEAMS (Équipes) ====================
CREATE TABLE teams (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id          UUID NOT NULL REFERENCES users(id),
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    city                VARCHAR(100),
    max_members         INT NOT NULL DEFAULT 15,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_creator ON teams(creator_id);
CREATE INDEX idx_teams_city ON teams(city);

-- ==================== 9. TEAM MEMBERS (Membres d'équipe) ====================
CREATE TABLE team_members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id             UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- CAPTAIN, MEMBER
    position            VARCHAR(50),                             -- GK, DEF, MID, FWD
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ==================== 10. TEAM INVITATIONS (Invitations aux équipes) ====================
CREATE TABLE team_invitations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id             UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by_id       UUID NOT NULL REFERENCES users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, invited_user_id)
);

CREATE INDEX idx_team_invitations_user ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);

-- ==================== 11. MATCHES (Matchs) ====================
CREATE TABLE matches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id        UUID NOT NULL REFERENCES users(id),
    booking_id          UUID REFERENCES bookings(id) ON DELETE SET NULL,
    field_id            UUID REFERENCES fields(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    match_date          TIMESTAMPTZ NOT NULL,
    duration_minutes    INT NOT NULL DEFAULT 60,
    max_players         INT,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, FULL, IN_PROGRESS, COMPLETED, CANCELLED
    is_public           BOOLEAN NOT NULL DEFAULT true,
    city                VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_organizer ON matches(organizer_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_city ON matches(city);

-- ==================== 12. MATCH PARTICIPANTS (Participants au match) ====================
CREATE TABLE match_participants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id            UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'REGISTERED', -- REGISTERED, CONFIRMED, DECLINED
    team_side           VARCHAR(10),                               -- A, B
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, user_id)
);

CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_user ON match_participants(user_id);

-- ==================== 13. MATCH TEAMS (Équipes participant au match) ====================
CREATE TABLE match_teams (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id            UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id             UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_side           VARCHAR(10) NOT NULL, -- A, B
    score               INT,
    UNIQUE (match_id, team_id)
);

-- ==================== 14. NOTIFICATIONS ====================
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    message             TEXT NOT NULL,
    type                VARCHAR(50) NOT NULL,
    read                BOOLEAN NOT NULL DEFAULT false,
    link                VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
