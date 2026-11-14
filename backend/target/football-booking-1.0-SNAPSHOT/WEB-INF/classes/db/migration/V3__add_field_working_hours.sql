-- ============================================================================
-- V3__add_field_working_hours.sql
-- Add opening and closing working hours (open_time, close_time) to fields
-- ============================================================================

ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS open_time VARCHAR(10) NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS close_time VARCHAR(10) NOT NULL DEFAULT '23:00';

