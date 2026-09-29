-- =========================================================
-- Platform Settings Table (Impulse UCEK Placement Suite)
-- Controls system-wide configuration such as student self-registration.
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    student_self_registration_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial single row: student self-registration disabled by default
INSERT INTO public.platform_settings (id, student_self_registration_enabled, created_at, updated_at)
VALUES ('default', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (required for signup availability check)
CREATE POLICY "Allow public read access to platform_settings"
    ON public.platform_settings FOR SELECT
    USING (true);

-- Allow full access to service role / backend
CREATE POLICY "Allow service role full access to platform_settings"
    ON public.platform_settings FOR ALL
    USING (true)
    WITH CHECK (true);
