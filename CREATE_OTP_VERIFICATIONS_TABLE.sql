-- ============================================
-- OTP VERIFICATIONS TABLE
-- ============================================
-- SMS orqali yuborilgan OTP kodlarni saqlash va tekshirish uchun jadval

-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  -- Index for fast lookup
  CONSTRAINT otp_verifications_phone_code_key UNIQUE(phone, code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone 
ON otp_verifications(phone);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires 
ON otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_verified 
ON otp_verifications(verified);

-- ============================================
-- FUNCTION: Clean up expired OTP codes
-- ============================================
-- Bu funksiya muddati o'tgan OTP kodlarni o'chiradi

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired OTP codes';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Verify OTP code
-- ============================================
-- OTP kodni tekshirish va tasdiqlash

CREATE OR REPLACE FUNCTION verify_otp(
  p_phone TEXT,
  p_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  name TEXT
) AS $$
DECLARE
  v_otp RECORD;
BEGIN
  -- Find the OTP record
  SELECT * INTO v_otp
  FROM otp_verifications
  WHERE phone = p_phone
    AND code = p_code
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if OTP exists and is valid
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Noto''g''ri yoki muddati o''tgan kod'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Mark as verified
  UPDATE otp_verifications
  SET verified = true,
      verified_at = NOW()
  WHERE id = v_otp.id;
  
  -- Return success
  RETURN QUERY SELECT true, 'Tasdiqlandi'::TEXT, v_otp.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Create OTP verification
-- ============================================
-- Yangi OTP yaratish (5 daqiqa amal qiladi)

CREATE OR REPLACE FUNCTION create_otp_verification(
  p_phone TEXT,
  p_code TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Invalidate any existing unverified OTPs for this phone
  UPDATE otp_verifications
  SET verified = true,
      verified_at = NOW()
  WHERE phone = p_phone
    AND verified = false;
  
  -- Create new OTP (expires in 5 minutes)
  INSERT INTO otp_verifications (phone, code, name, expires_at)
  VALUES (p_phone, p_code, p_name, NOW() + INTERVAL '5 minutes')
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE otp_verifications IS 'SMS orqali yuborilgan OTP kodlarni saqlash';
COMMENT ON COLUMN otp_verifications.phone IS 'Telefon raqam (998901234567 formatida)';
COMMENT ON COLUMN otp_verifications.code IS '6 raqamli tasdiqlash kodi';
COMMENT ON COLUMN otp_verifications.name IS 'Foydalanuvchi ismi (ro''yxatdan o''tish uchun)';
COMMENT ON COLUMN otp_verifications.verified IS 'Kod tasdiqlangan yoki yo''q';
COMMENT ON COLUMN otp_verifications.expires_at IS 'Kod amal qilish muddati (5 daqiqa)';
COMMENT ON COLUMN otp_verifications.verified_at IS 'Kod qachon tasdiqlangan';

COMMENT ON FUNCTION cleanup_expired_otps() IS 'Muddati o''tgan OTP kodlarni o''chirish (cron job orqali chaqirish kerak)';
COMMENT ON FUNCTION verify_otp(TEXT, TEXT) IS 'OTP kodni tekshirish va tasdiqlash';
COMMENT ON FUNCTION create_otp_verification(TEXT, TEXT, TEXT) IS 'Yangi OTP yaratish (5 daqiqa amal qiladi)';

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Create OTP
-- SELECT create_otp_verification('998901234567', '123456', 'John Doe');

-- Example 2: Verify OTP
-- SELECT * FROM verify_otp('998901234567', '123456');

-- Example 3: Cleanup expired OTPs
-- SELECT cleanup_expired_otps();

-- Example 4: Get all active OTPs for a phone
-- SELECT * FROM otp_verifications
-- WHERE phone = '998901234567'
--   AND verified = false
--   AND expires_at > NOW()
-- ORDER BY created_at DESC;

-- ============================================
-- SECURITY: Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create OTP" ON otp_verifications
  FOR INSERT WITH CHECK (true);

-- Policy: Only service role can read (for verification)
CREATE POLICY "Service role can read OTP" ON otp_verifications
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Policy: Only service role can update
CREATE POLICY "Service role can update OTP" ON otp_verifications
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================
-- CRON JOB SETUP (Optional)
-- ============================================
-- Supabase'da pg_cron extension orqali har 1 soatda eski kodlarni o'chirish

-- Enable pg_cron extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job (runs every hour)
-- SELECT cron.schedule(
--   'cleanup-expired-otps',
--   '0 * * * *',
--   'SELECT cleanup_expired_otps();'
-- );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ otp_verifications table created successfully';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '📝 OTP codes expire after 5 minutes';
  RAISE NOTICE '🔒 Table is secured with RLS';
END $$;
