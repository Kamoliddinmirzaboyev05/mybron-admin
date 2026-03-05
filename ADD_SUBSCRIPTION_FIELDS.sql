-- ============================================
-- ADD SUBSCRIPTION FIELDS TO PROFILES TABLE
-- ============================================
-- This migration adds subscription management fields to the profiles table

-- Add subscription fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_end_date DATE,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
ON profiles(subscription_days, subscription_end_date);

-- ============================================
-- FUNCTION: Update subscription days daily
-- ============================================
-- This function should be called daily to decrement subscription_days

CREATE OR REPLACE FUNCTION update_subscription_days()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET subscription_days = GREATEST(subscription_days - 1, 0)
  WHERE subscription_days > 0;
  
  RAISE NOTICE 'Updated subscription days for all active subscriptions';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Add subscription to profile
-- ============================================
-- Call this function when a user pays for subscription

CREATE OR REPLACE FUNCTION add_subscription(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    subscription_days = subscription_days + p_days,
    subscription_end_date = CURRENT_DATE + (subscription_days + p_days),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RAISE NOTICE 'Added % days to subscription for user %', p_days, p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.subscription_days IS 'Number of days remaining in subscription. 0 = expired';
COMMENT ON COLUMN profiles.subscription_end_date IS 'Date when subscription expires';
COMMENT ON COLUMN profiles.total_revenue IS 'Total revenue earned by this admin (sum of all confirmed bookings)';
COMMENT ON COLUMN profiles.balance IS 'Current withdrawable balance';

COMMENT ON FUNCTION update_subscription_days() IS 'Decrements subscription_days by 1 for all active subscriptions. Should be run daily via cron job';
COMMENT ON FUNCTION add_subscription(UUID, INTEGER) IS 'Adds subscription days to a user profile. Call when payment is received';

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Add 30 days subscription to a user
-- SELECT add_subscription('user-uuid-here', 30);

-- Example 2: Check users with expiring subscriptions (less than 7 days)
-- SELECT id, name, email, subscription_days, subscription_end_date
-- FROM profiles
-- WHERE subscription_days > 0 AND subscription_days < 7
-- ORDER BY subscription_days ASC;

-- Example 3: Get all expired subscriptions
-- SELECT id, name, email, subscription_end_date
-- FROM profiles
-- WHERE subscription_days = 0 AND subscription_end_date IS NOT NULL
-- ORDER BY subscription_end_date DESC;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================
-- Give all existing admins a 30-day trial

DO $$
BEGIN
  UPDATE profiles
  SET 
    subscription_days = 30,
    subscription_end_date = CURRENT_DATE + 30
  WHERE role IN ('admin', 'superadmin')
    AND subscription_days = 0;
  
  RAISE NOTICE '✅ Granted 30-day trial to all existing admins';
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription fields added to profiles table';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '📝 Set up a daily cron job to call update_subscription_days()';
  RAISE NOTICE '💡 Use add_subscription(user_id, days) to add subscription time';
END $$;
