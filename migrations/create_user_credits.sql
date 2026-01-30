-- ============================================
-- Credits System Migration
-- ============================================
--
-- This migration creates the user_credits table to track free credits
-- for users who sign in via Google OAuth.
--
-- Features:
-- - Each user gets 5 free credits on first sign-in
-- - Credits are deducted after each AI generation
-- - Users can add unlimited API key to bypass credits
--
-- Run this in Supabase SQL Editor after Google OAuth is configured
-- ============================================

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL DEFAULT 5 CHECK (credits >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only read their own credits balance
CREATE POLICY "Users can read own credits"
    ON user_credits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only update their own credits (for deduction)
CREATE POLICY "Users can update own credits"
    ON user_credits
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own credits record (auto-initialization)
CREATE POLICY "Users can insert own credits"
    ON user_credits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Optional: Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries (Run after migration)
-- ============================================

-- Check if table was created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'user_credits';

-- View existing credits (after you've signed in)
SELECT *
FROM user_credits
WHERE user_id = auth.uid();
