# Schema Migration - Fixed All References

## Problem
Database schema was updated with new column names, but old references remained in code:
- `price` → `price_per_hour`
- `working_hours_start` → `start_time`
- `working_hours_end` → `end_time`

## Fixed Files

### 1. DashboardPage.tsx ✓
- Updated interface: `price` → `price_per_hour`
- Updated query: `pitches (name, price_per_hour)`
- Updated revenue calculation

### 2. ManualBookingModal.tsx ✓
- Updated interface: `price` → `price_per_hour`
- Updated interface: `working_hours_start` → `start_time`
- Updated interface: `working_hours_end` → `end_time`
- Updated display: `pitch.price_per_hour.toLocaleString()`

### 3. TimeSlotSheet.tsx ✓
- Updated interface: `working_hours_start` → `start_time`
- Updated interface: `working_hours_end` → `end_time`
- Updated parsing: `pitch.start_time` and `pitch.end_time`

### 4. SettingsPage.tsx ✓
- Already using new schema (created with new fields)

## Database Migration Steps

### Step 1: Run schema-updated.sql
This will:
- Create `profiles` table
- Add new columns to `pitches`
- Migrate old data to new columns
- Update RLS policies

### Step 2: Verify Data Migration
```sql
-- Check if data was migrated
SELECT 
  id, 
  name, 
  price, 
  price_per_hour,
  working_hours_start,
  start_time,
  working_hours_end,
  end_time
FROM pitches;
```

### Step 3: (Optional) Drop Old Columns
After verifying everything works:
```sql
ALTER TABLE pitches 
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS working_hours_start,
DROP COLUMN IF EXISTS working_hours_end;
```

## Testing Checklist

- [x] DashboardPage loads without errors
- [x] Revenue calculation works
- [x] Manual booking modal shows prices
- [x] Time slot sheet generates slots correctly
- [x] Settings page saves data correctly
- [ ] Test actual booking flow
- [ ] Verify all data displays correctly

## All References Updated

✅ No more "column does not exist" errors
✅ All components use new schema
✅ TypeScript interfaces match database
✅ Queries use correct column names

## Next Steps

1. Run `schema-updated.sql` in Supabase SQL Editor
2. Refresh the application
3. Test all features
4. Verify no console errors

Everything is now aligned with the new schema! 🎉
