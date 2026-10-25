-- ============================================================================
-- V2__add_enum_casts.sql
-- Create implicit casts from varchar to PostgreSQL enum types
-- Required for JPA / Hibernate to insert/update enum values without casting errors
-- ============================================================================

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

    IF NOT EXISTS (SELECT 1 FROM pg_cast c JOIN pg_type s ON c.castsource = s.oid JOIN pg_type t ON c.casttarget = t.oid WHERE s.typname = 'varchar' AND t.typname = 'day_of_week') THEN
        CREATE CAST (varchar AS day_of_week) WITH INOUT AS IMPLICIT;
    END IF;
END $$;
