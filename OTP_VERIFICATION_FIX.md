# ✅ OTP Verification Logic - Fixed

## Issues Found and Fixed

### 1. ❌ Parameter Order Was Wrong
**Problem**: The code was calling `verify_otp` with parameters in the wrong order.

**Before**:
```typescript
const { data: verifyData, error: verifyError } = await supabase.rpc('verify_otp', {
  p_phone: cleanPhone,  // ❌ Wrong order
  p_code: code,         // ❌ Wrong order
});
```

**After**:
```typescript
const { data: verifyData, error: verifyError } = await supabase.rpc('verify_otp', {
  p_code: code,         // ✅ Correct: First parameter
  p_phone: cleanPhone,  // ✅ Correct: Second parameter
});
```

### 2. ❌ Wrong Return Type Handling
**Problem**: The code was expecting an array with an object, but the database returns a boolean.

**Before**:
```typescript
// verify_otp funksiyasi array qaytaradi
const result = verifyData?.[0];

if (!result || !result.success) {
  return {
    success: false,
    error: result?.message || 'Noto\'g\'ri yoki muddati o\'tgan kod',
  };
}
```

**After**:
```typescript
// Database funksiyasi boolean qaytaradi
// true = success, false = invalid/expired
if (verifyData === true) {
  return {
    success: true,
    message: 'Tasdiqlandi',
  };
} else {
  return {
    success: false,
    error: 'Noto\'g\'ri yoki muddati o\'tgan kod',
  };
}
```

### 3. ✅ Phone Sanitization (Already Correct)
The phone number sanitization was already correct:
```typescript
const cleanPhone = phone.replace(/\D/g, ''); // Removes +, spaces, dashes, etc.
```

### 4. ✅ Code Validation Enhanced
Added regex validation to ensure code is exactly 6 digits:
```typescript
if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
  return {
    success: false,
    error: 'Tasdiqlash kodi 6 raqamdan iborat bo\'lishi kerak',
  };
}
```

## Database Function Signature

Your PostgreSQL function:
```sql
verify_otp(p_code text, p_phone text) RETURNS boolean
```

Parameters:
- `p_code` (text) - 6-digit OTP code (e.g., "123456")
- `p_phone` (text) - Phone number without '+' (e.g., "998889563848")

Returns:
- `true` - Code is valid and verified
- `false` - Code is invalid or expired

## Updated Flow

```
1. User enters code: "123456"
2. User's phone from state: "+998 88 956 38 48"
   ↓
3. Sanitize phone: "998889563848" (remove all non-digits)
   ↓
4. Validate inputs:
   - Code: 6 digits? ✓
   - Phone: 12 digits? ✓
   ↓
5. Call RPC with correct parameter order:
   supabase.rpc('verify_otp', {
     p_code: "123456",        // First parameter
     p_phone: "998889563848"  // Second parameter
   })
   ↓
6. Database checks:
   - Code matches? ✓
   - Not expired? ✓
   - Not already verified? ✓
   ↓
7. Returns: true (boolean)
   ↓
8. Frontend handles:
   if (verifyData === true) {
     // Success! Create account
   } else {
     // Show error
   }
```

## Testing

### Test Case 1: Valid OTP
```typescript
// Input
phone: "+998 88 956 38 48"
code: "123456"

// After sanitization
cleanPhone: "998889563848"

// RPC call
supabase.rpc('verify_otp', {
  p_code: "123456",
  p_phone: "998889563848"
})

// Expected result
verifyData: true
```

### Test Case 2: Invalid OTP
```typescript
// Input
phone: "+998 88 956 38 48"
code: "999999"

// RPC call
supabase.rpc('verify_otp', {
  p_code: "999999",
  p_phone: "998889563848"
})

// Expected result
verifyData: false
```

### Test Case 3: Expired OTP
```typescript
// Input (code older than 5 minutes)
phone: "+998 88 956 38 48"
code: "123456"

// RPC call
supabase.rpc('verify_otp', {
  p_code: "123456",
  p_phone: "998889563848"
})

// Expected result
verifyData: false
```

## Manual Testing Steps

### 1. Test in Browser Console
```javascript
// Open browser console on /register page
const { createClient } = require('@supabase/supabase-js');

// Test the RPC call directly
const result = await supabase.rpc('verify_otp', {
  p_code: '123456',
  p_phone: '998889563848'
});

console.log('Result:', result);
// Should see: { data: true/false, error: null }
```

### 2. Test Full Registration Flow
```
1. Open /register
2. Enter name: "Test User"
3. Enter phone: "+998 88 956 38 48"
4. Click "Telegram orqali kod olish"
5. In Telegram:
   - Open @MyBronRobot
   - Send /start
   - Share contact
   - Receive code (e.g., "123456")
6. Back on website:
   - Enter code: 1 2 3 4 5 6
   - Click "Tasdiqlash"
7. Expected: Success message and redirect to dashboard
```

### 3. Test Error Cases

**Invalid Code**:
```
1. Enter wrong code: 9 9 9 9 9 9
2. Click "Tasdiqlash"
3. Expected: "Noto'g'ri yoki muddati o'tgan kod"
```

**Expired Code**:
```
1. Wait 6 minutes after receiving code
2. Enter the old code
3. Click "Tasdiqlash"
4. Expected: "Noto'g'ri yoki muddati o'tgan kod"
```

**Invalid Phone Format**:
```
1. Manually call verifyOTP with invalid phone
2. Expected: "Telefon raqam noto'g'ri formatda"
```

## SQL Query to Check OTP Records

```sql
-- Check recent OTP attempts
SELECT 
  phone,
  code,
  verified,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN verified = true THEN 'VERIFIED'
    ELSE 'ACTIVE'
  END as status
FROM otp_verifications
WHERE phone = '998889563848'
ORDER BY created_at DESC
LIMIT 5;
```

## Debugging Tips

### Enable Console Logging
The updated code includes console.error for debugging:
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

### Check Network Tab
1. Open DevTools → Network tab
2. Filter: "verify_otp"
3. Check request payload:
   ```json
   {
     "p_code": "123456",
     "p_phone": "998889563848"
   }
   ```
4. Check response:
   ```json
   {
     "data": true,
     "error": null
   }
   ```

### Check Supabase Logs
```bash
# View function logs
supabase functions logs telegram-bot --tail

# Check database logs
# In Supabase Dashboard → Database → Logs
```

## Summary of Changes

### File: `src/lib/smsService.ts`

✅ Fixed parameter order: `p_code` first, then `p_phone`  
✅ Fixed return type handling: boolean instead of array  
✅ Enhanced validation: regex check for 6-digit code  
✅ Added console logging for debugging  
✅ Improved error messages  
✅ Better documentation in comments  

### File: `src/app/components/RegisterPage.tsx`

✅ Already correct: Phone sanitization with `.replace(/\D/g, '')`  
✅ Already correct: Passes clean phone to `verifyOTP()`  

## Verification Checklist

- [x] Parameter names match database: `p_code`, `p_phone`
- [x] Parameter order correct: code first, phone second
- [x] Phone sanitization removes all non-digits
- [x] Code validation checks for exactly 6 digits
- [x] Return type handling matches boolean response
- [x] Error handling for all cases
- [x] Console logging for debugging
- [x] Comments explain the logic

## Next Steps

1. **Test the fix**:
   ```bash
   # Start the dev server
   npm run dev
   
   # Open /register
   # Complete the full flow
   ```

2. **Monitor logs**:
   ```bash
   # Watch for any errors
   # Check browser console
   # Check Supabase logs
   ```

3. **Verify database**:
   ```sql
   -- Check if verification is working
   SELECT * FROM otp_verifications 
   WHERE verified = true 
   ORDER BY verified_at DESC 
   LIMIT 5;
   ```

## Status

✅ **FIXED**: Parameter order corrected  
✅ **FIXED**: Return type handling corrected  
✅ **VERIFIED**: Phone sanitization working  
✅ **ENHANCED**: Validation improved  
✅ **READY**: For testing  

---

**Date**: March 5, 2026  
**Status**: Ready for Testing  
**Files Modified**: `src/lib/smsService.ts`
