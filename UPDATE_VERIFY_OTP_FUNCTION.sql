-- ============================================
-- UPDATE VERIFY_OTP FUNCTION
-- ============================================
-- Simplified version: Only takes code parameter and returns phone number

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS verify_otp(text, text);
DROP FUNCTION IF EXISTS verify_otp(text);

-- ============================================
-- FUNCTION: Verify OTP code (simplified)
-- ============================================
-- Takes only the code and returns the phone number if valid

CREATE OR REPLACE FUNCTION verify_otp(
  p_code TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_otp RECORD;
BEGIN
  -- Find the OTP record by code only
  SELECT * INTO v_otp
  FROM otp_verifications
  WHERE code = p_code
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if OTP exists and is valid
  IF NOT FOUND THEN
    RETURN NULL;  -- Invalid or expired code
  END IF;
  
  -- Mark as verified
  UPDATE otp_verifications
  SET verified = true,
      verified_at = NOW()
  WHERE id = v_otp.id;
  
  -- Return the phone number
  RETURN v_otp.phone;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION verify_otp(TEXT) IS 'Verify OTP code and return phone number if valid (simplified version)';

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Verify OTP (returns phone number)
-- SELECT verify_otp('123456');
-- Returns: '998901234567' if valid, NULL if invalid/expired

-- Example 2: Check if code is valid
-- SELECT 
--   CASE 
--     WHEN verify_otp('123456') IS NOT NULL THEN 'Valid'
--     ELSE 'Invalid'
--   END as status;

-- ============================================
-- TESTING
-- ============================================

-- Test 1: Create a test OTP
-- SELECT create_otp_verification('998901234567', '123456', 'Test User');

-- Test 2: Verify it
-- SELECT verify_otp('123456');
-- Expected: '998901234567'

-- Test 3: Try to verify again (should fail - already verified)
-- SELECT verify_otp('123456');
-- Expected: NULL

-- Test 4: Try invalid code
-- SELECT verify_otp('999999');
-- Expected: NULL

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ verify_otp function updated successfully';
  RAISE NOTICE '📝 Function now takes only p_code parameter';
  RAISE NOTICE '📝 Returns phone number (TEXT) if valid, NULL if invalid';
  RAISE NOTICE '🔒 Automatically marks code as verified';
END $$;
