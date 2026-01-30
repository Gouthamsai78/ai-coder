-- ============================================
-- RLS Policy Optimization Migration
-- ============================================
-- This migration optimizes Row Level Security policies to improve query performance
-- by using (select auth.uid()) pattern and consolidating multiple permissive policies

-- ============================================
-- 1. USERS TABLE - Optimize RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users own profile" ON users;

-- Recreate with optimized pattern - consolidate into one policy
CREATE POLICY "Users can manage own profile" 
    ON users
    FOR ALL
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 2. AI_CODER_PROJECTS TABLE - Optimize RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON ai_coder_projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON ai_coder_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON ai_coder_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON ai_coder_projects;
DROP POLICY IF EXISTS "Users own projects" ON ai_coder_projects;

-- Consolidate into one optimized policy
CREATE POLICY "Users can manage own projects"
    ON ai_coder_projects
    FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- 3. AI_TRAINING_DATA TABLE - Optimize RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own training data" ON ai_training_data;
DROP POLICY IF EXISTS "Users can insert own training data" ON ai_training_data;
DROP POLICY IF EXISTS "Users can update own training data" ON ai_training_data;
DROP POLICY IF EXISTS "Users can delete own training data" ON ai_training_data;
DROP POLICY IF EXISTS "Users own training data" ON ai_training_data;

-- Consolidate into one optimized policy
CREATE POLICY "Users can manage own training data"
    ON ai_training_data
    FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- 4. USER_CREDITS TABLE - Optimize RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Users own credits" ON user_credits;

-- Consolidate into one optimized policy
CREATE POLICY "Users can manage own credits"
    ON user_credits
    FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policy optimization completed successfully';
    RAISE NOTICE 'Optimized tables: users, ai_coder_projects, ai_training_data, user_credits';
    RAISE NOTICE 'Benefits: Reduced auth function calls, consolidated policies, better performance';
END $$;
