-- Extension for GiST range exclusion with UUID equality
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Table users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    version       BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_email_lowercase CHECK (email = lower(email)),
    CONSTRAINT chk_users_role CHECK (role IN ('PLAYER', 'FIELD_MANAGER', 'ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 2. Table fields
CREATE TABLE fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    address         VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    latitude        NUMERIC(9, 6),
    longitude       NUMERIC(9, 6),
    phone           VARCHAR(20),
    field_type      VARCHAR(10) NOT NULL,
    surface_type    VARCHAR(50),
    capacity        INTEGER,
    price_per_hour  NUMERIC(10, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'MAD',
    indoor          BOOLEAN NOT NULL DEFAULT FALSE,
    has_lights      BOOLEAN NOT NULL DEFAULT TRUE,
    has_locker_room BOOLEAN NOT NULL DEFAULT TRUE,
    has_parking     BOOLEAN NOT NULL DEFAULT TRUE,
    open_time       TIME NOT NULL,
    close_time      TIME NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    photo_filename  VARCHAR(100),
    reviewed_by_id  UUID REFERENCES users(id),
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fields_type CHECK (field_type IN ('5v5', '7v7', '11v11')),
    CONSTRAINT chk_fields_price CHECK (price_per_hour > 0),
    CONSTRAINT chk_fields_working_hours CHECK (open_time < close_time),
    CONSTRAINT chk_fields_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_fields_owner ON fields(owner_id);
CREATE INDEX idx_fields_status ON fields(status);
CREATE INDEX idx_fields_city_approved ON fields(city) WHERE status = 'APPROVED';
CREATE INDEX idx_fields_reviewed_by ON fields(reviewed_by_id);

-- 3. Table teams
CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    version     BIGINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_name ON teams(name);

-- 4. Table team_members
CREATE TABLE team_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id    UUID NOT NULL REFERENCES teams(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    role       VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version    BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_team_members_role CHECK (role IN ('CAPTAIN', 'MEMBER')),
    CONSTRAINT uq_team_members_team_user UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE UNIQUE INDEX idx_team_members_captain ON team_members(team_id) WHERE role = 'CAPTAIN';

-- 5. Table team_invitations
CREATE TABLE team_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id),
    invited_user_id UUID NOT NULL REFERENCES users(id),
    invited_by_id   UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_team_invitations_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'))
);

CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_invited_user ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_invited_by ON team_invitations(invited_by_id);
CREATE UNIQUE INDEX idx_team_invitations_pending ON team_invitations(team_id, invited_user_id) WHERE status = 'PENDING';

-- 6. Table matches
CREATE TABLE matches (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id       UUID NOT NULL REFERENCES users(id),
    home_team_id     UUID NOT NULL REFERENCES teams(id),
    away_team_id     UUID NOT NULL REFERENCES teams(id),
    start_at         TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    version          BIGINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_matches_teams_diff CHECK (home_team_id <> away_team_id),
    CONSTRAINT chk_matches_duration CHECK (duration_minutes BETWEEN 30 AND 240),
    CONSTRAINT chk_matches_status CHECK (status IN ('PLANNED', 'FINISHED', 'CANCELLED'))
);

CREATE INDEX idx_matches_creator ON matches(creator_id);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_start_at ON matches(start_at);

-- 7. Table bookings
CREATE TABLE bookings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID NOT NULL REFERENCES matches(id),
    user_id      UUID NOT NULL REFERENCES users(id),
    field_id     UUID NOT NULL REFERENCES fields(id),
    start_at     TIMESTAMPTZ NOT NULL,
    end_at       TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency     VARCHAR(3) NOT NULL DEFAULT 'MAD',
    notes        VARCHAR(1000),
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    handled_by_id UUID REFERENCES users(id),
    handled_at   TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    reason       VARCHAR(500),
    version      BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_bookings_time_order CHECK (start_at < end_at),
    CONSTRAINT excl_bookings_overlap EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    ) WHERE (status IN ('PENDING', 'CONFIRMED'))
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_field ON bookings(field_id);
CREATE INDEX idx_bookings_match ON bookings(match_id);
CREATE INDEX idx_bookings_handled_by ON bookings(handled_by_id);
CREATE UNIQUE INDEX idx_bookings_active_match ON bookings(match_id) WHERE status IN ('PENDING', 'CONFIRMED');
