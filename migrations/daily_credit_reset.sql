-- ============================================
-- Daily Credit Reset System Migration
-- ============================================
-- This migration adds automatic daily credit reset functionality
-- Users get 5 credits per day that reset at midnight UTC

-- Step 1: Add last_reset_date column if it doesn't exist
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Step 2: Update existing records to have today's date
UPDATE user_credits 
SET last_reset_date = CURRENT_DATE 
WHERE last_reset_date IS NULL;

-- Step 3: Create function to check and reset credits daily
CREATE OR REPLACE FUNCTION check_and_reset_daily_credits(p_user_id UUID)
RETURNS TABLE(credits INT, was_reset BOOLEAN, last_reset DATE) AS $$
DECLARE
    v_current_credits INT;
    v_last_reset DATE;
    v_was_reset BOOLEAN := FALSE;
BEGIN
    -- Get current credits and last reset date
    SELECT uc.credits, uc.last_reset_date
    INTO v_current_credits, v_last_reset
    FROM user_credits uc
    WHERE uc.user_id = p_user_id;

    -- If no record exists, create one with 5 credits
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, credits, last_reset_date)
        VALUES (p_user_id, 5, CURRENT_DATE)
        RETURNING user_credits.credits, TRUE, user_credits.last_reset_date 
        INTO v_current_credits, v_was_reset, v_last_reset;
        
        RAISE NOTICE 'Created new credit record for user %: 5 credits', p_user_id;
    -- If last reset was before today, reset to 5 credits
    ELSIF v_last_reset < CURRENT_DATE THEN
        UPDATE user_credits
        SET credits = 5,
            last_reset_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING user_credits.credits, user_credits.last_reset_date 
        INTO v_current_credits, v_last_reset;
        
        v_was_reset := TRUE;
        RAISE NOTICE 'Reset credits for user %: 5 credits (was %, last reset: %)', 
                     p_user_id, v_current_credits, v_last_reset;
    END IF;

    RETURN QUERY SELECT v_current_credits, v_was_reset, v_last_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_and_reset_daily_credits(UUID) TO authenticated;

-- Verification queries
DO $$
BEGIN
    RAISE NOTICE '✅ Daily credit reset migration completed successfully';
    RAISE NOTICE 'Column added: last_reset_date';
    RAISE NOTICE 'Function created: check_and_reset_daily_credits()';
    RAISE NOTICE 'Credits will now automatically reset to 5 every day!';
END $$;
