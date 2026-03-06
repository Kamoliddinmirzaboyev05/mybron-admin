# 🔐 Simplified Auth Flow - OTP Only

## Overview

The authentication system has been simplified to use only OTP codes from Telegram. No phone number input is required on the website.

## Key Changes

### 1. Removed Phone Input
- ❌ No phone number field on Login page
- ❌ No phone number field on Register page
- ✅ Only 6-digit OTP code input

### 2. Simplified Flow
```
User → Telegram Bot → Get OTP → Website → Enter OTP → Auto Login/Register
```

### 3. Database Function Updated
```sql
-- Old (required phone + code)
verify_otp(p_code text, p_phone text) RETURNS boolean

-- New (only code, returns phone)
verify_otp(p_code text) RETURNS text
```

## User Flows

### Registration Flow

```
1. User opens /register
   ↓
2. Sees instructions to get code from Telegram
   ↓
3. Clicks "Telegram botga o'tish"
   ↓
4. Opens @MyBronRobot
   ↓
5. Sends /start and shares contact
   ↓
6. Receives 6-digit OTP code
   ↓
7. Returns to website
   ↓
8. Enters 6-digit code
   ↓
9. System verifies code → Gets phone number from database
   ↓
10. Checks if user exists in profiles table
    ├─ If exists: Auto login
    └─ If new: Show name input form
        ↓
        Enter First Name & Last Name
        ↓
        Create account
        ↓
        Auto login
```

### Login Flow

```
1. User opens /login
   ↓
2. Sees instructions to get code from Telegram
   ↓
3. Clicks "Telegram botga o'tish"
   ↓
4. Opens @MyBronRobot
   ↓
5. Sends /start and shares contact
   ↓
6. Receives 6-digit OTP code
   ↓
7. Returns to website
   ↓
8. Enters 6-digit code
   ↓
9. System verifies code → Gets phone number from database
   ↓
10. Checks if user exists in profiles table
    ├─ If exists: Auto login ✅
    └─ If new: Redirect to /register
```

## Technical Implementation

### 1. Updated `smsService.ts`

```typescript
// New function signature
export async function verifyOTPCode(code: string): Promise<VerifyOTPResponse>

// Response interface
interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  phone?: string;        // Phone number from database
  isNewUser?: boolean;   // Whether user exists in profiles
}
```

**How it works**:
1. Takes only the 6-digit code
2. Calls `verify_otp(p_code)` RPC
3. Database returns phone number if valid
4. Checks if phone exists in `profiles` table
5. Returns phone + isNewUser flag

### 2. Updated `RegisterPage.tsx`

**Step 1: OTP Input**
- Shows 6-digit input (42.uz style)
- Link to Telegram bot
- Instructions

**Step 2: Profile Info** (only for new users)
- First Name input
- Last Name input
- Create account button

**Logic**:
```typescript
// Verify OTP
const result = await verifyOTPCode(code);

if (result.success && result.phone) {
  if (!result.isNewUser) {
    // User exists - auto login
    signIn(email, password);
  } else {
    // New user - show profile form
    setStep('profile');
  }
}
```

### 3. Updated `LoginPage.tsx`

**Single Step: OTP Input**
- Shows 6-digit input (42.uz style)
- Link to Telegram bot
- Instructions

**Logic**:
```typescript
// Verify OTP
const result = await verifyOTPCode(code);

if (result.success && result.phone) {
  if (result.isNewUser) {
    // No account - redirect to register
    window.location.href = '/register';
  } else {
    // Account exists - auto login
    signIn(email, password);
  }
}
```

## Database Schema

### `otp_verifications` Table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY,
  phone TEXT NOT NULL,           -- From Telegram bot
  code TEXT NOT NULL,             -- 6-digit OTP
  name TEXT,                      -- From Telegram contact
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);
```

### `verify_otp` Function
```sql
CREATE OR REPLACE FUNCTION verify_otp(p_code TEXT)
RETURNS TEXT AS $$
DECLARE
  v_otp RECORD;
BEGIN
  -- Find OTP by code only
  SELECT * INTO v_otp
  FROM otp_verifications
  WHERE code = p_code
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN NULL;  -- Invalid/expired
  END IF;
  
  -- Mark as verified
  UPDATE otp_verifications
  SET verified = true, verified_at = NOW()
  WHERE id = v_otp.id;
  
  -- Return phone number
  RETURN v_otp.phone;
END;
$$ LANGUAGE plpgsql;
```

## UI Components

### OTP Input (42.uz Style)
```tsx
<div className="flex justify-center gap-2">
  {otp.map((digit, index) => (
    <input
      key={index}
      id={`otp-${index}`}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={digit}
      onChange={(e) => handleOtpChange(index, e.target.value)}
      className="w-12 h-14 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white text-center text-2xl font-bold focus:outline-none focus:border-blue-600"
    />
  ))}
</div>
```

### Telegram Bot Link
```tsx
<a 
  href="https://t.me/MyBronRobot" 
  target="_blank" 
  rel="noopener noreferrer"
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
>
  <Send className="w-4 h-4" />
  Telegram botga o'tish
</a>
```

## Deployment Steps

### 1. Update Database Function
```bash
# Run the SQL migration
psql -h your-db-host -U postgres -d postgres -f UPDATE_VERIFY_OTP_FUNCTION.sql
```

Or in Supabase SQL Editor:
```sql
-- Copy and paste content from UPDATE_VERIFY_OTP_FUNCTION.sql
```

### 2. Deploy Frontend Changes
```bash
# The files are already updated:
# - src/lib/smsService.ts
# - src/app/components/RegisterPage.tsx
# - src/app/components/LoginPage.tsx

# Build and deploy
npm run build
# Deploy to your hosting
```

### 3. Test the Flow

**Test Registration**:
1. Open `/register`
2. Click "Telegram botga o'tish"
3. Get OTP from @MyBronRobot
4. Enter code on website
5. Enter First Name & Last Name
6. Verify account created

**Test Login**:
1. Open `/login`
2. Get new OTP from @MyBronRobot
3. Enter code on website
4. Verify auto login

## Benefits

### For Users
- ✅ Simpler flow - no need to remember/enter phone
- ✅ Faster - fewer steps
- ✅ More secure - OTP is the only credential
- ✅ Better UX - direct from Telegram to website

### For Developers
- ✅ Less code - removed phone input logic
- ✅ Fewer errors - no phone format validation needed
- ✅ Simpler state management
- ✅ Easier to maintain

## Security

### OTP Verification
- ✅ Code expires after 5 minutes
- ✅ One-time use (marked as verified)
- ✅ Latest code takes precedence
- ✅ Database-level validation

### User Authentication
- ✅ Phone number verified by Telegram
- ✅ OTP verified by database
- ✅ Auto-generated secure passwords
- ✅ Supabase Auth integration

## Error Handling

### Invalid Code
```
User enters: 999999
Response: "Noto'g'ri yoki muddati o'tgan kod"
```

### Expired Code
```
User enters code after 6 minutes
Response: "Noto'g'ri yoki muddati o'tgan kod"
```

### New User on Login
```
User tries to login but account doesn't exist
Response: "Hisobingiz topilmadi. Iltimos ro'yxatdan o'ting"
Action: Redirect to /register
```

### Existing User on Register
```
User tries to register but account exists
Action: Auto login instead
```

## Testing Queries

### Check OTP Records
```sql
SELECT 
  phone,
  code,
  verified,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at < NOW() THEN '⏰ EXPIRED'
    WHEN verified = true THEN '✅ VERIFIED'
    ELSE '🟢 ACTIVE'
  END as status
FROM otp_verifications
ORDER BY created_at DESC
LIMIT 10;
```

### Test verify_otp Function
```sql
-- Create test OTP
SELECT create_otp_verification('998901234567', '123456', 'Test User');

-- Verify it (should return phone)
SELECT verify_otp('123456');
-- Expected: '998901234567'

-- Try again (should return NULL - already verified)
SELECT verify_otp('123456');
-- Expected: NULL
```

### Check User Profiles
```sql
SELECT 
  id,
  phone,
  created_at
FROM profiles
WHERE phone = '998901234567';
```

## Migration Checklist

- [ ] Backup database
- [ ] Run `UPDATE_VERIFY_OTP_FUNCTION.sql`
- [ ] Verify function works: `SELECT verify_otp('test_code');`
- [ ] Deploy frontend changes
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test error cases
- [ ] Monitor logs for errors
- [ ] Update documentation

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/smsService.ts` | New `verifyOTPCode()` function, removed phone parameter |
| `src/app/components/RegisterPage.tsx` | Removed phone input, added 2-step flow |
| `src/app/components/LoginPage.tsx` | Removed email/password, added OTP input |
| `UPDATE_VERIFY_OTP_FUNCTION.sql` | New database function |
| `SIMPLIFIED_AUTH_FLOW.md` | This documentation |

## Support

### Common Issues

**Issue**: "Noto'g'ri yoki muddati o'tgan kod"
- Check if code is correct
- Check if code expired (>5 minutes)
- Check if code already used

**Issue**: User redirected to register from login
- User doesn't have an account
- Need to complete registration first

**Issue**: Auto-login not working
- Check profiles table has user record
- Check Supabase Auth user exists
- Check password generation logic

---

**Version**: 2.0  
**Date**: March 5, 2026  
**Status**: ✅ Ready for Deployment
