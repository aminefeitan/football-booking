-- ============================================================================
-- V1__initial_schema.sql
-- Football Booking Application — Initial Database Schema
-- ============================================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- Required for exclusion constraints on ranges

-- ==================== ENUM TYPES ====================
CREATE TYPE user_role AS ENUM ('PLAYER', 'FIELD_MANAGER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');
CREATE TYPE booking_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- ==================== USERS ====================
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

-- ==================== PLAYER PROFILES ====================
CREATE TABLE player_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_position  VARCHAR(50),
    skill_level         VARCHAR(20),    -- BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL
    city                VARCHAR(100),
    bio                 TEXT,
    available           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== SPORTS ====================
CREATE TABLE sports (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(100) NOT NULL UNIQUE,
    icon    VARCHAR(50)
);

-- Seed default sports
INSERT INTO sports (name, icon) VALUES
    ('Football', 'football'),
    ('Basketball', 'basketball'),
    ('Tennis', 'tennis'),
    ('Volleyball', 'volleyball'),
    ('Handball', 'handball');

-- ==================== SPORTS CENTERS ====================
CREATE TABLE sports_centers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id      UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    address         VARCHAR(500) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(20),
    latitude        NUMERIC(10, 7),
    longitude       NUMERIC(10, 7),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sports_centers_city ON sports_centers(city);
CREATE INDEX idx_sports_centers_manager ON sports_centers(manager_id);

-- ==================== FIELDS ====================
CREATE TABLE fields (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sports_center_id    UUID NOT NULL REFERENCES sports_centers(id) ON DELETE CASCADE,
    sport_id            UUID NOT NULL REFERENCES sports(id),
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    surface_type        VARCHAR(50),    -- NATURAL_GRASS, SYNTHETIC, INDOOR, CLAY, HARD_COURT
    capacity            INT,            -- Max number of players
    price_per_hour      NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    indoor              BOOLEAN NOT NULL DEFAULT false,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fields_sports_center ON fields(sports_center_id);
CREATE INDEX idx_fields_sport ON fields(sport_id);
CREATE INDEX idx_fields_active ON fields(active) WHERE active = true;

-- ==================== FIELD OPENING HOURS ====================
CREATE TABLE field_opening_hours (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id    UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    open_time   TIME NOT NULL,
    close_time  TIME NOT NULL,
    UNIQUE (field_id, day_of_week)
);

-- ==================== FIELD CLOSURES (exceptional closures) ====================
CREATE TABLE field_closures (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id    UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    start_at    TIMESTAMPTZ NOT NULL,
    end_at      TIMESTAMPTZ NOT NULL,
    reason      VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_closures_field ON field_closures(field_id);

-- ==================== BOOKINGS ====================
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    field_id            UUID NOT NULL REFERENCES fields(id),
    start_at            TIMESTAMPTZ NOT NULL,
    end_at              TIMESTAMPTZ NOT NULL,
    total_amount        NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    status              booking_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    notes               TEXT,
    expires_at          TIMESTAMPTZ,    -- For PENDING_PAYMENT: auto-expire after timeout
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Business rules enforced at DB level
    CONSTRAINT chk_booking_times CHECK (start_at < end_at),
    CONSTRAINT chk_booking_duration CHECK (end_at - start_at <= INTERVAL '4 hours')
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_field ON bookings(field_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings(field_id, start_at, end_at);

-- Exclusion constraint: prevent overlapping bookings for the same field
-- Only blocks bookings with statuses that actually occupy the time slot
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings
    ADD CONSTRAINT excl_booking_no_overlap
    EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    )
    WHERE (status IN ('PENDING_PAYMENT', 'CONFIRMED'));

-- ==================== TEAMS ====================
CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(id),
    sport_id        UUID NOT NULL REFERENCES sports(id),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    city            VARCHAR(100),
    max_members     INT NOT NULL DEFAULT 15,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_creator ON teams(creator_id);
CREATE INDEX idx_teams_sport ON teams(sport_id);

-- ==================== TEAM MEMBERS ====================
CREATE TABLE team_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    role        VARCHAR(20) NOT NULL DEFAULT 'MEMBER',  -- CAPTAIN, MEMBER
    position    VARCHAR(50),                              -- GK, DEF, MID, FWD, etc.
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ==================== MATCHES ====================
CREATE TABLE matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id    UUID NOT NULL REFERENCES users(id),
    booking_id      UUID REFERENCES bookings(id),
    field_id        UUID REFERENCES fields(id),
    sport_id        UUID NOT NULL REFERENCES sports(id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    match_date      TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    max_players     INT,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',  -- OPEN, FULL, IN_PROGRESS, COMPLETED, CANCELLED
    is_public       BOOLEAN NOT NULL DEFAULT true,
    city            VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_organizer ON matches(organizer_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_sport ON matches(sport_id);

-- ==================== MATCH PARTICIPANTS ====================
CREATE TABLE match_participants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',  -- REGISTERED, CONFIRMED, DECLINED
    team_side   VARCHAR(10),                                  -- A, B (for team assignment)
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, user_id)
);

-- ==================== MATCH TEAMS ====================
CREATE TABLE match_teams (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id     UUID NOT NULL REFERENCES teams(id),
    team_side   VARCHAR(10) NOT NULL,  -- A, B (home / away)
    score       INT,
    UNIQUE (match_id, team_id)
);

-- ==================== SUBSCRIPTION PLANS ====================
CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           NUMERIC(12, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'MAD',
    duration_days   INT NOT NULL,
    features        TEXT,               -- JSON or comma-separated features
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== USER SUBSCRIPTIONS ====================
CREATE TABLE user_subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, EXPIRED, CANCELLED
    auto_renew      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);

-- ==================== PAYMENTS ====================
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    booking_id          UUID REFERENCES bookings(id),
    subscription_id     UUID REFERENCES user_subscriptions(id),
    amount              NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'MAD',
    status              payment_status NOT NULL DEFAULT 'PENDING',
    payment_method      VARCHAR(50),
    transaction_ref     VARCHAR(255),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A payment must reference either a booking or a subscription
    CONSTRAINT chk_payment_reference CHECK (
        (booking_id IS NOT NULL AND subscription_id IS NULL) OR
        (booking_id IS NULL AND subscription_id IS NOT NULL)
    )
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id),
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50) NOT NULL,   -- BOOKING_CONFIRMED, MATCH_REMINDER, TEAM_INVITATION, etc.
    read        BOOLEAN NOT NULL DEFAULT false,
    link        VARCHAR(500),           -- Optional deep link
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
