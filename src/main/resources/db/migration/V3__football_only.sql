-- ============================================================================
-- V3__football_only.sql
-- Refactoring: Platform focused exclusively on football fields & teams
-- Removes: sports, sports_centers, subscription_plans, user_subscriptions
-- Enriches: fields with football-specific attributes
-- ============================================================================

-- ==================== DROP UNUSED TABLES ====================
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Remove sport_id and sports_center_id FKs from fields
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_sport_id_fkey;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_sports_center_id_fkey;
ALTER TABLE fields DROP COLUMN IF EXISTS sport_id;
ALTER TABLE fields DROP COLUMN IF EXISTS sports_center_id;

-- Add football-specific columns to fields
ALTER TABLE fields ADD COLUMN IF NOT EXISTS address       VARCHAR(500);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS city          VARCHAR(100);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS postal_code   VARCHAR(20);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS latitude      NUMERIC(10, 7);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS longitude     NUMERIC(10, 7);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS phone         VARCHAR(20);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS field_type    VARCHAR(10)  NOT NULL DEFAULT '5v5'; -- 5v5, 7v7, 11v11
ALTER TABLE fields ADD COLUMN IF NOT EXISTS has_lights    BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS has_locker_room BOOLEAN    NOT NULL DEFAULT false;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS has_parking   BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS owner_id      UUID REFERENCES users(id);

-- Add city index on fields
CREATE INDEX IF NOT EXISTS idx_fields_city ON fields(city);

-- Remove sport_id from teams
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_sport_id_fkey;
ALTER TABLE teams DROP COLUMN IF EXISTS sport_id;

-- Remove sport_id from matches
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_sport_id_fkey;
ALTER TABLE matches DROP COLUMN IF EXISTS sport_id;

-- Drop sports_centers and sports tables (no longer needed)
DROP TABLE IF EXISTS field_closures CASCADE;
DROP TABLE IF EXISTS field_opening_hours CASCADE;
DROP TABLE IF EXISTS sports_centers CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP CAST IF EXISTS (varchar AS day_of_week);
DROP TYPE  IF EXISTS day_of_week CASCADE;

-- Remove booking_id reference from payments if subscription no longer exists
-- subscription_id already nulled via CASCADE from user_subscriptions drop

-- ==================== TEAM INVITATIONS ====================
-- Add invitation system for teams
CREATE TABLE IF NOT EXISTS team_invitations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id),
    invited_by_id   UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, ACCEPTED, DECLINED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_user ON team_invitations(invited_user_id);

-- ==================== MATCH SCORE ====================
-- Store final match scores
ALTER TABLE match_teams ADD COLUMN IF NOT EXISTS yellow_cards INT DEFAULT 0;
ALTER TABLE match_teams ADD COLUMN IF NOT EXISTS red_cards    INT DEFAULT 0;
