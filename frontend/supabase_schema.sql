-- =========================================================
-- UCEK Unstop Igniters Placement Platform - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================

-- 1. App State Synchronization Table (Required for instant JSON sync)
CREATE TABLE IF NOT EXISTS public.app_state (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) or add public access policy
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to app_state"
    ON public.app_state FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert/update access to app_state"
    ON public.app_state FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Optional Relational Tables (For direct relational querying)

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'mentee',
    year TEXT,
    branch TEXT,
    domain_interest TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    readiness_score INT DEFAULT 50,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roadmaps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    overall_progress INT DEFAULT 0,
    modules JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    score INT NOT NULL,
    total INT NOT NULL,
    percentage FLOAT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentorships (
    id TEXT PRIMARY KEY,
    mentor JSONB NOT NULL,
    mentee JSONB NOT NULL,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    check_in_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
