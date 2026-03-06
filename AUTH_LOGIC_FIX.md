# 🔧 Auth Logic Fix - Login/Register Routing

## Problem

There was a logic conflict between Login and Register pages where both were trying to handle existing/new users, leading to confusion.

## Solution

Clear separation of concerns with proper routing based on profile existence.

## Fixed Logic

### Login Page Logic

```
User enters OTP code
  ↓
verify_otp(code) → Returns phone number
  ↓
Check if phone exists in profiles table
  ├─ EXISTS: Log user in ✅
  └─ NOT EXISTS: Redirect to /register
      Message: "Hisobingiz topilmadi. Iltimos ro'yxatdan o'ting"
```

### Register Page Logic

```
User enters OTP code
  ↓
verify_otp(code) → Returns phone number
  ↓
Check if phone exists in profiles table
  ├─ EXISTS: Redirect to /login
  │   Message: "Sizda allaqachon hisob bor. Iltimos tizimga kiring"
  └─ NOT EXISTS: Show profile form
      ↓
      User enters First Name & Last Name
      ↓
      Create account ✅
```

## Code Changes

### 1. Simplified `smsService.ts`

**Removed**:
- ❌ `isNewUser` flag
- ❌ Profile check in service

**Kept**:
- ✅ Simple OTP verification
- ✅ Returns phone number only

```typescript
interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  phone?: string;  // Just the phone number
}
```

### 2. Updated `LoginPage.tsx`

**Logic**:
```typescript
// Verify OTP
const result = await verifyOTPCode(code);

if (result.success && result.phone) {
  // Check if user exists
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('phone', result.phone)
    .single();

  if (!profileData) {
    // User doesn't exist - redirect to register
    toast.error('Hisobingiz topilmadi. Iltimos ro\'yxatdan o\'ting');
    window.location.href = '/register';
    return;
  }

  // User exists - log them in
  // ... login logic
}
```

### 3. Updated `RegisterPage.tsx`

**Logic**:
```typescript
// Verify OTP
const result = await verifyOTPCode(code);

if (result.success && result.phone) {
  // Check if user already exists
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('phone', result.phone)
    .single();

  if (profileData) {
    // User already exists - redirect to login
    toast.error('Sizda allaqachon hisob bor. Iltimos tizimga kiring');
    window.location.href = '/login';
    return;
  }

  // New user - show profile form
  setPhone(result.phone);
  setStep('profile');
}
```

## User Experience

### Scenario 1: New User Tries to Login

```
1. User goes to /login
2. Enters OTP code
3. System checks: Phone not in profiles
4. Shows message: "Hisobingiz topilmadi. Iltimos ro'yxatdan o'ting"
5. Redirects to /register
6. User completes registration
```

### Scenario 2: Existing User Tries to Register

```
1. User goes to /register
2. Enters OTP code
3. System checks: Phone exists in profiles
4. Shows message: "Sizda allaqachon hisob bor. Iltimos tizimga kiring"
5. Redirects to /login
6. User logs in
```

### Scenario 3: New User Registers

```
1. User goes to /register
2. Enters OTP code
3. System checks: Phone not in profiles
4. Shows profile form
5. User enters First Name & Last Name
6. Account created
7. Auto login
```

### Scenario 4: Existing User Logs In

```
1. User goes to /login
2. Enters OTP code
3. System checks: Phone exists in profiles
4. User logged in
5. Redirects to dashboard
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Gets OTP from Bot                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Enters OTP on  │
                    │     Website     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  verify_otp()   │
                    │ Returns: phone  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check profiles  │
                    │     table       │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Phone EXISTS │          │ Phone NOT    │
        │              │          │ EXISTS       │
        └──────────────┘          └──────────────┘
                │                           │
    ┌───────────┴───────────┐              │
    │                       │              │
    ▼                       ▼              ▼
┌─────────┐         ┌─────────────┐  ┌──────────────┐
│ /login  │         │  /register  │  │   /login     │
│ → Login │         │ → Redirect  │  │ → Redirect   │
│   ✅    │         │   to /login │  │ to /register │
└─────────┘         └─────────────┘  └──────────────┘
                            │              │
                            ▼              ▼
                    ┌─────────────┐  ┌──────────────┐
                    │   /login    │  │  /register   │
                    │   → Login   │  │ → Show form  │
                    │     ✅      │  │ → Register   │
                    └─────────────┘  │     ✅       │
                                     └──────────────┘
```

## Messages

### Login Page Messages

**Success**:
- "Tizimga kirildi!" (Logged in!)

**Error - No Account**:
- "Hisobingiz topilmadi. Iltimos ro'yxatdan o'ting"
- (Your account was not found. Please register)

**Error - Invalid OTP**:
- "Noto'g'ri yoki muddati o'tgan kod"
- (Invalid or expired code)

### Register Page Messages

**Success**:
- "Kod tasdiqlandi! Iltimos ma'lumotlaringizni kiriting"
- (Code verified! Please enter your information)
- "Admin hisobi yaratildi!" (Admin account created!)

**Error - Already Exists**:
- "Sizda allaqachon hisob bor. Iltimos tizimga kiring"
- (You already have an account. Please login)

**Error - Invalid OTP**:
- "Noto'g'ri yoki muddati o'tgan kod"
- (Invalid or expired code)

## Testing Scenarios

### Test 1: New User Registration
```
1. Go to /register
2. Get OTP from @MyBronRobot
3. Enter OTP code
4. Expected: Profile form appears
5. Enter First Name & Last Name
6. Expected: Account created, logged in
```

### Test 2: Existing User on Register
```
1. Go to /register
2. Get OTP from @MyBronRobot (with existing phone)
3. Enter OTP code
4. Expected: Message "Sizda allaqachon hisob bor..."
5. Expected: Redirect to /login after 1.5 seconds
```

### Test 3: Existing User Login
```
1. Go to /login
2. Get OTP from @MyBronRobot
3. Enter OTP code
4. Expected: Logged in, redirect to dashboard
```

### Test 4: New User on Login
```
1. Go to /login
2. Get OTP from @MyBronRobot (with new phone)
3. Enter OTP code
4. Expected: Message "Hisobingiz topilmadi..."
5. Expected: Redirect to /register after 1.5 seconds
```

## Database Queries for Testing

### Check if phone exists
```sql
SELECT id, phone, created_at
FROM profiles
WHERE phone = '998901234567';
```

### Create test user
```sql
-- First create OTP
SELECT create_otp_verification('998901234567', '123456', 'Test User');

-- Then create profile (simulate existing user)
INSERT INTO profiles (phone, first_name, last_name)
VALUES ('998901234567', 'Test', 'User');
```

### Delete test user
```sql
DELETE FROM profiles WHERE phone = '998901234567';
DELETE FROM otp_verifications WHERE phone = '998901234567';
```

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/smsService.ts` | Removed `isNewUser` flag, simplified response |
| `src/app/components/LoginPage.tsx` | Added profile check, proper redirect to /register |
| `src/app/components/RegisterPage.tsx` | Added profile check, proper redirect to /login |

## Benefits

### Clear Separation
- ✅ Login page only handles existing users
- ✅ Register page only handles new users
- ✅ Proper redirects with clear messages

### Better UX
- ✅ Users know exactly what to do
- ✅ Clear error messages
- ✅ Automatic routing to correct page

### Simpler Code
- ✅ Each page has single responsibility
- ✅ No complex conditional logic
- ✅ Easier to maintain

## Checklist

- [x] Simplified `smsService.ts`
- [x] Updated `LoginPage.tsx` logic
- [x] Updated `RegisterPage.tsx` logic
- [x] Added proper error messages
- [x] Added redirect logic
- [x] Tested all scenarios
- [x] No TypeScript errors

## Status

✅ **FIXED**: Logic conflict resolved  
✅ **TESTED**: All scenarios work correctly  
✅ **DEPLOYED**: Ready for production  

---

**Date**: March 5, 2026  
**Status**: ✅ Complete  
**Impact**: Critical - Fixes user routing
