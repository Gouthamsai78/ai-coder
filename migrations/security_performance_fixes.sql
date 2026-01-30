-- Security & Performance Fixes for AI Coder Database
-- Run this in your Supabase SQL Editor

-- ============================================
-- SECURITY FIXES
-- ============================================

-- Fix 1: Set search_path on increment_likes function
ALTER FUNCTION public.increment_likes SET search_path = public;

-- Fix 2: Set search_path on decrement_likes function
ALTER FUNCTION public.decrement_likes SET search_path = public;

-- Fix 3: Set search_path on update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column SET search_path = public;

-- ============================================
-- PERFORMANCE FIXES
-- ============================================

-- Fix 4: Add missing index for foreign key on ai_coder_projects.user_id
CREATE INDEX IF NOT EXISTS idx_ai_coder_projects_user_id 
ON public.ai_coder_projects(user_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, check these queries to verify:

-- Check functions have search_path set:
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('increment_likes', 'decrement_likes', 'update_updated_at_column');

-- Check index exists:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'ai_coder_projects' AND indexname = 'idx_ai_coder_projects_user_id';
