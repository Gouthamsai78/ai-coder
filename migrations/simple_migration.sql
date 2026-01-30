-- ============================================
-- AI Coder - Simplified Database Migration
-- ============================================
-- Copy this entire file and paste in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vnkbrthsuejouxtlampe/sql/new
-- ============================================

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS ai_coder_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    chat_history JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_coder_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON ai_coder_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON ai_coder_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON ai_coder_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON ai_coder_projects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON ai_coder_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON ai_coder_projects(created_at DESC);

-- 2. TRAINING DATA TABLE
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES ai_coder_projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    context_code TEXT,
    generated_code TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    is_accepted BOOLEAN DEFAULT false,
    model_used TEXT,
    provider TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own training data" ON ai_training_data FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can view own training data" ON ai_training_data FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON ai_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_project_id ON ai_training_data(project_id);

-- 3. USER CREDITS TABLE
CREATE TABLE IF NOT EXISTS user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL DEFAULT 5 CHECK (credits >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON ai_coder_projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON ai_coder_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VERIFY
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ai_coder_projects', 'ai_training_data', 'user_credits');
