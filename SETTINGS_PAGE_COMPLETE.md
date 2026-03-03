# Settings Page - Complete Implementation

## ✅ Completed Tasks

### Task 1: Fetch & Bind Data ✓
- Fetches pitch data where `owner_id` equals current user's ID
- Pre-fills all input fields with existing data
- Creates default pitch if none exists

### Task 2: Geolocation Feature ✓
- "Aniqlash" button implemented
- Uses `navigator.geolocation` to get coordinates
- Updates latitude and longitude in state
- Shows success toast notification
- Displays coordinates in read-only fields

### Task 3: Update Logic ✓
- "O'zgarishlarni saqlash" button updates all fields:
  - name
  - price_per_hour
  - location
  - landmark
  - start_time
  - end_time
  - latitude
  - longitude
  - is_active (set to true on save)
- Loading state during save
- Toast notification: "Muvaffaqiyatli saqlandi!"

### Task 4: Role Protection ✓
- Checks user role from `profiles` table
- Only accessible if role is 'admin' or 'superadmin'
- Shows "Ruxsat yo'q" message for non-admin users

### Task 5: Business Logic (Schedule) ✓
- Validates end_time > start_time
- Shows error message if validation fails
- Disables save button when validation fails
- Real-time validation feedback

## Database Setup

### Step 1: Run Updated Schema

```bash
# In Supabase SQL Editor, run:
schema-updated.sql
```

This will:
- Create `profiles` table with role field
- Add new columns to `pitches` table
- Set up RLS policies
- Create auto-profile trigger

### Step 2: Create Storage Bucket

```bash
# In Supabase SQL Editor, run:
storage-setup.sql
```

Or manually:
1. Go to Storage > Create bucket
2. Name: `pitch-images`
3. Public: ✓

### Step 3: Set User Role

```sql
-- Make your user an admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID';
```

## Features

### Form Fields
- ✅ Maydon nomi (required)
- ✅ Soatlik narx (required, number)
- ✅ Manzil (required)
- ✅ Mo'ljal (optional)
- ✅ Latitude/Longitude (auto-filled via geolocation)
- ✅ Ish vaqti - Boshlanishi (required, time)
- ✅ Ish vaqti - Tugashi (required, time)
- ✅ Rasmlar (multiple upload)

### Validations
- ✅ Required fields check
- ✅ End time must be after start time
- ✅ Real-time validation feedback
- ✅ File size limit (5MB)
- ✅ Image format check

### User Experience
- ✅ Toast notifications (success/error)
- ✅ Loading states on all async operations
- ✅ Disabled states during operations
- ✅ Status indicator (Faol/Nofaol)
- ✅ Image preview with delete option
- ✅ Geolocation button with loading state

### Security
- ✅ Role-based access control
- ✅ Owner-based data fetching
- ✅ RLS policies on database
- ✅ User authentication required

## Usage

### 1. Login as Admin
```bash
# Make sure your user has admin role
npm run dev
# Navigate to /login
```

### 2. Go to Settings
- Click "Sozlamalar" in bottom navigation
- Page will load your pitch data

### 3. Fill Form
- Enter pitch name, price, location
- Optionally add landmark
- Click "Aniqlash" to get coordinates
- Set working hours
- Upload images (optional)

### 4. Save
- Click "O'zgarishlarni saqlash"
- Wait for success toast
- Pitch status will change to "Faol"

## API Calls

### Fetch Pitch
```typescript
supabase
  .from('pitches')
  .select('*')
  .eq('owner_id', user.id)
  .single()
```

### Update Pitch
```typescript
supabase
  .from('pitches')
  .update({
    name, price_per_hour, location, landmark,
    start_time, end_time, latitude, longitude,
    images, is_active: true
  })
  .eq('id', pitch.id)
```

### Check Role
```typescript
supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
```

### Upload Image
```typescript
supabase.storage
  .from('pitch-images')
  .upload(fileName, file)
```

## Error Handling

All operations have try-catch blocks with toast notifications:
- ✅ Fetch errors
- ✅ Update errors
- ✅ Upload errors
- ✅ Geolocation errors
- ✅ Validation errors

## Testing Checklist

- [ ] Login as admin user
- [ ] Page loads pitch data
- [ ] All fields are pre-filled
- [ ] Can edit all fields
- [ ] Geolocation button works
- [ ] Coordinates are displayed
- [ ] Time validation works
- [ ] Can upload images
- [ ] Can delete images
- [ ] Save button works
- [ ] Toast notifications appear
- [ ] Status changes to "Faol"
- [ ] Non-admin users see error

## Next Steps

1. Run `schema-updated.sql` in Supabase
2. Create storage bucket
3. Set your user role to 'admin'
4. Test the settings page
5. Upload some images
6. Verify data is saved correctly

Everything is ready! 🎉
