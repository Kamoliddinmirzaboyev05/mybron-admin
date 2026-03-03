# Fix Sign-up 500 Error - Troubleshooting Guide

## Error Description
```
POST https://...supabase.co/auth/v1/signup 500 (Internal Server Error)
AuthApiError: Database error saving new user
```

## Root Cause
The `handle_new_user()` trigger function is trying to insert data into columns that don't exist in the `pitches` table, specifically:
- `images` (TEXT[] array)
- `amenities` (TEXT[] array)

## Solution

### Step 1: Run the Fix Script
Open Supabase SQL Editor and run: `fix-signup-complete.sql`

This script will:
1. ✅ Add missing columns (`images`, `amenities`)
2. ✅ Fix column names (`name` → `full_name`)
3. ✅ Add unique constraint on `owner_id`
4. ✅ Recreate trigger function with correct columns
5. ✅ Update RLS policies
6. ✅ Grant necessary permissions

### Step 2: Verify Database Structure

Run these queries to verify:

```sql
-- Check profiles columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Expected columns:
-- id, full_name, phone, role, created_at, updated_at
```

```sql
-- Check pitches columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'pitches' 
ORDER BY ordinal_position;

-- Expected columns:
-- id, owner_id, name, price_per_hour, location, landmark,
-- start_time, end_time, latitude, longitude, is_active,
-- images, amenities, created_at, updated_at
```

### Step 3: Test Registration

1. Go to Register page
2. Enter email, password, and name
3. Click "Ro'yxatdan o'tish"
4. Should redirect to Dashboard

### Step 4: Verify Data Created

```sql
-- Check if profile was created
SELECT id, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 1;

-- Check if pitch was created
SELECT id, owner_id, name, images, amenities 
FROM pitches 
ORDER BY created_at DESC 
LIMIT 1;
```

## Common Issues & Solutions

### Issue 1: Column Already Exists Error
**Error:** `column "images" of relation "pitches" already exists`

**Solution:** The column exists but might have wrong type. Drop and recreate:
```sql
ALTER TABLE pitches DROP COLUMN IF EXISTS images;
ALTER TABLE pitches ADD COLUMN images TEXT[] DEFAULT '{}';
```

### Issue 2: Unique Constraint Violation
**Error:** `duplicate key value violates unique constraint "pitches_owner_id_key"`

**Solution:** User already has a pitch. Either:
- Delete existing pitch: `DELETE FROM pitches WHERE owner_id = 'user-id';`
- Or modify trigger to use `ON CONFLICT (owner_id) DO NOTHING`

### Issue 3: Permission Denied
**Error:** `permission denied for table pitches`

**Solution:** Grant permissions:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Issue 4: Trigger Not Firing
**Error:** User created but no profile/pitch

**Solution:** Check if trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If not exists, recreate it from the script.

## Key Changes in Fix Script

### 1. Added Missing Columns
```sql
ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
```

### 2. Updated Trigger Function
```sql
INSERT INTO public.pitches (
  -- ... other columns
  images,      -- ✅ Added
  amenities,   -- ✅ Added
  -- ...
)
VALUES (
  -- ...
  '{}',  -- images
  '{}',  -- amenities
  -- ...
);
```

### 3. Error Handling
```sql
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;  -- Don't block user creation
END;
```

## Testing Checklist

- [ ] Run `fix-signup-complete.sql`
- [ ] Verify profiles table structure
- [ ] Verify pitches table structure
- [ ] Test new user registration
- [ ] Check profile created in database
- [ ] Check pitch created in database
- [ ] Verify images column is empty array
- [ ] Verify amenities column is empty array
- [ ] Test login with new user
- [ ] Test accessing Settings page

## Prevention

To prevent this error in the future:
1. Always update trigger function when adding new columns
2. Test registration after schema changes
3. Use `IF NOT EXISTS` when adding columns
4. Add proper error handling in triggers
5. Monitor Supabase logs for warnings

## Rollback (if needed)

If something goes wrong, you can rollback:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Then re-run the fix script
```

## Success Indicators

✅ Registration completes without errors
✅ User redirected to Dashboard
✅ Profile exists in database with correct role
✅ Pitch exists in database with empty arrays
✅ No 500 errors in console
✅ No warnings in Supabase logs

## Support

If the error persists:
1. Check Supabase logs (Dashboard → Logs)
2. Look for specific error messages
3. Verify all columns exist
4. Check RLS policies are correct
5. Ensure permissions are granted
