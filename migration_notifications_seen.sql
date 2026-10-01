-- =========================================================
-- Migration: Add last_mock_test_notifications_seen_at to student_profiles
-- Impulse — UCEK Placement Platform
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================

ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS last_mock_test_notifications_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN public.student_profiles.last_mock_test_notifications_seen_at IS
'Timestamp when the student last consumed/opened mock test notifications. Used to persist notification read state across authenticated sessions.';
