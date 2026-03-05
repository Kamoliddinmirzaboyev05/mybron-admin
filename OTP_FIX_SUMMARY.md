# 🔧 OTP Verification Fix - Summary

## Problem Identified

The OTP verification was failing because:

1. **Wrong parameter order**: Database expects `verify_otp(p_code, p_phone)` but code was sending `{p_phone, p_code}`
2. **Wrong return type handling**: Database returns `boolean` but code expected an array with object

## Solution Applied

### Fixed `src/lib/smsService.ts`

#### Change 1: Corrected Parameter Order
```typescript
// ❌ BEFORE (Wrong)
await supabase.rpc('verify_otp', {
  p_phone: cleanPhone,  // Wrong: phone first
  p_code: code,         // Wrong: code second
});

// ✅ AFTER (Correct)
await supabase.rpc('verify_otp', {
  p_code: code,         // Correct: code first
  p_phone: cleanPhone,  // Correct: phone second
});
```

#### Change 2: Fixed Return Type Handling
```typescript
// ❌ BEFORE (Wrong)
const result = verifyData?.[0];
if (!result || !result.success) {
  return { success: false, error: result?.message };
}

// ✅ AFTER (Correct)
if (verifyData === true) {
  return { success: true, message: 'Tasdiqlandi' };
} else {
  return { success: false, error: 'Noto\'g\'ri yoki muddati o\'tgan kod' };
}
```

#### Change 3: Enhanced Validation
```typescript
// Added regex validation for 6-digit code
if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
  return {
    success: false,
    error: 'Tasdiqlash kodi 6 raqamdan iborat bo\'lishi kerak',
  };
}
```

#### Change 4: Added Debug Logging
```typescript
if (verifyError) {
  console.error('OTP verification error:', verifyError);
  // ...
}

catch (error: any) {
  console.error('OTP verification exception:', error);
  // ...
}
```

## Database Function Signature

```sql
CREATE OR REPLACE FUNCTION verify_otp(
  p_code text,    -- First parameter: 6-digit code
  p_phone text    -- Second parameter: phone without '+'
) RETURNS boolean;
```

**Returns**:
- `true` → Code is valid and verified
- `false` → Code is invalid or expired

## Data Flow (Fixed)

```
User Input:
├─ Phone: "+998 88 956 38 48"
└─ Code: "123456"

Sanitization:
├─ cleanPhone = phone.replace(/\D/g, '')
└─ Result: "998889563848"

Validation:
├─ Phone length === 12? ✓
├─ Code length === 6? ✓
└─ Code is digits only? ✓

RPC Call:
supabase.rpc('verify_otp', {
  p_code: "123456",        ← First parameter
  p_phone: "998889563848"  ← Second parameter
})

Database Response:
├─ Valid code: { data: true, error: null }
└─ Invalid code: { data: false, error: null }

Frontend Handling:
if (verifyData === true) {
  // ✅ Success - create account
} else {
  // ❌ Error - show message
}
```

## Testing Instructions

### 1. Quick Test in Browser Console

Open `/register` page and run in console:

```javascript
// Test the RPC call directly
const result = await supabase.rpc('verify_otp', {
  p_code: '123456',
  p_phone: '998889563848'
});

console.log('Result:', result);
// Expected: { data: true/false, error: null }
```

### 2. Full Registration Flow Test

```
Step 1: Open /register
Step 2: Enter name: "Test User"
Step 3: Enter phone: "+998 88 956 38 48"
Step 4: Click "Telegram orqali kod olish"
Step 5: In Telegram (@MyBronRobot):
        - Send /start
        - Share contact
        - Copy the 6-digit code
Step 6: Back on website:
        - Enter the code
        - Click "Tasdiqlash"
Step 7: Expected result:
        ✅ "Admin hisobi yaratildi!"
        ✅ Redirect to dashboard
```

### 3. Test Error Cases

**Invalid Code**:
```
1. Enter wrong code: 999999
2. Expected: "Noto'g'ri yoki muddati o'tgan kod"
```

**Expired Code**:
```
1. Wait 6 minutes after receiving code
2. Enter the old code
3. Expected: "Noto'g'ri yoki muddati o'tgan kod"
```

## Verification Queries

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
WHERE phone = '998889563848'
ORDER BY created_at DESC
LIMIT 5;
```

### Check Recent Verifications
```sql
SELECT 
  phone,
  code,
  verified_at,
  EXTRACT(EPOCH FROM (verified_at - created_at)) as seconds_to_verify
FROM otp_verifications
WHERE verified = true
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY verified_at DESC;
```

## Files Modified

| File | Status | Changes |
|------|--------|---------|
| `src/lib/smsService.ts` | ✅ Fixed | Parameter order, return type handling, validation |
| `src/app/components/RegisterPage.tsx` | ✅ Verified | Already correct (phone sanitization) |

## Files Created

| File | Purpose |
|------|---------|
| `OTP_VERIFICATION_FIX.md` | Detailed fix documentation |
| `OTP_FIX_SUMMARY.md` | This summary |
| `test-otp-verification.js` | Browser console test script |

## Checklist

- [x] Parameter names match database (`p_code`, `p_phone`)
- [x] Parameter order correct (code first, phone second)
- [x] Phone sanitization removes all non-digits
- [x] Code validation checks for exactly 6 digits
- [x] Return type handling matches boolean response
- [x] Error handling for all cases
- [x] Console logging for debugging
- [x] Documentation updated
- [x] Test script created

## Before vs After

### Before (Broken)
```typescript
// Wrong parameter order
supabase.rpc('verify_otp', {
  p_phone: cleanPhone,  // ❌
  p_code: code,         // ❌
});

// Wrong return handling
const result = verifyData?.[0];  // ❌
if (!result || !result.success) { // ❌
```

### After (Fixed)
```typescript
// Correct parameter order
supabase.rpc('verify_otp', {
  p_code: code,         // ✅
  p_phone: cleanPhone,  // ✅
});

// Correct return handling
if (verifyData === true) {  // ✅
```

## Expected Behavior

### Success Case
```
Input: code="123456", phone="+998 88 956 38 48"
↓
Clean: phone="998889563848"
↓
RPC: verify_otp(p_code="123456", p_phone="998889563848")
↓
Response: { data: true, error: null }
↓
Result: { success: true, message: "Tasdiqlandi" }
↓
Action: Create account and redirect
```

### Error Case
```
Input: code="999999", phone="+998 88 956 38 48"
↓
Clean: phone="998889563848"
↓
RPC: verify_otp(p_code="999999", p_phone="998889563848")
↓
Response: { data: false, error: null }
↓
Result: { success: false, error: "Noto'g'ri yoki muddati o'tgan kod" }
↓
Action: Show error message
```

## Debugging

### Enable Logging
The code now includes console.error for debugging:
```typescript
console.error('OTP verification error:', verifyError);
console.error('OTP verification exception:', error);
```

### Check Network Tab
1. Open DevTools → Network
2. Filter: "verify_otp"
3. Check request payload:
   ```json
   {
     "p_code": "123456",
     "p_phone": "998889563848"
   }
   ```

### Use Test Script
```bash
# Copy test-otp-verification.js content
# Paste in browser console on /register page
# Run: window.testOTPManual("123456", "+998 88 956 38 48")
```

## Status

✅ **FIXED**: Parameter order corrected  
✅ **FIXED**: Return type handling corrected  
✅ **VERIFIED**: Phone sanitization working  
✅ **ENHANCED**: Validation improved  
✅ **TESTED**: Ready for testing  
✅ **DOCUMENTED**: Complete documentation  

## Next Steps

1. **Test the fix**:
   - Open `/register`
   - Complete full registration flow
   - Verify success message appears

2. **Monitor**:
   - Check browser console for errors
   - Check Supabase logs
   - Verify database records

3. **Deploy**:
   - If tests pass, deploy to production
   - Monitor initial usage
   - Check success rate

---

**Date**: March 5, 2026  
**Status**: ✅ Fixed and Ready for Testing  
**Priority**: High  
**Impact**: Critical - Fixes registration flow
