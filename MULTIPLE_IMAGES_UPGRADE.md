# Multiple Images Upload System - Upgrade Guide

## Overview
This upgrade converts the single image upload system to support multiple images per pitch (up to 8 images).

## Changes Made

### 1. Database Schema (SQL)
**File:** `upgrade-to-multiple-images.sql`

- Added `images` column (TEXT[] array) to `pitches` table
- Migrated existing `image_url` data to `images` array
- Default value: `{}` (empty array)

**To Apply:**
1. Open Supabase SQL Editor
2. Run `upgrade-to-multiple-images.sql`
3. Verify with provided queries

### 2. Frontend Changes (SettingsPage.tsx)

#### Interface Update
```typescript
interface Pitch {
  // Changed from:
  image_url: string | null;
  
  // To:
  images: string[];
}
```

#### New Features

**Multiple File Selection:**
- File input now has `multiple` attribute
- Users can select multiple images at once
- Maximum 8 images per pitch

**Sequential Upload:**
- Files are uploaded one by one to `pitch_images` bucket
- Progress indicator shows current/total (e.g., "2 / 5 rasm")
- Progress bar shows visual upload progress

**Image Gallery:**
- Grid layout (2 columns) showing all uploaded images
- Each image has:
  - Delete button (X) on hover
  - Image number badge (1, 2, 3...)
  - Fallback for broken images

**Smart Upload Area:**
- Shows when images < MAX_IMAGES
- Hides when limit reached
- Shows warning message at limit

**Delete Function:**
- Click X button on any image to remove it
- Removes from database array
- Deletes from storage bucket
- Updates UI immediately

#### State Management

**New State Variables:**
```typescript
const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
const MAX_IMAGES = 8;
```

**Upload Progress:**
- Tracks current file being uploaded
- Shows progress bar
- Displays "X / Y rasm" text

### 3. Key Functions

#### `handleImageUpload()`
- Validates file count against MAX_IMAGES
- Validates each file (type, size)
- Uploads files sequentially
- Updates progress after each upload
- Adds all URLs to images array
- Cleans up on error

#### `handleRemoveImage(imageUrl)`
- Filters out specific image from array
- Updates database
- Deletes from storage
- Reverts on error

#### `handleSave()`
- Now saves `images` array instead of `image_url`
- All other fields remain the same

### 4. UI Components

#### Image Gallery
```tsx
<div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
  {pitch.images.map((imageUrl, index) => (
    <div className="relative flex-shrink-0 w-64 snap-start group">
      <img src={imageUrl} className="w-full h-40 object-cover" />
      <button onClick={() => handleRemoveImage(imageUrl)}>
        <X />
      </button>
      <div className="badge">{index + 1} / {total}</div>
    </div>
  ))}
</div>
```

**Features:**
- Horizontal scrollable slider (1 row)
- Snap scrolling for smooth navigation
- Each image is 256px wide (w-64)
- Custom scrollbar styling
- Shadow effects for depth
- Smooth scroll behavior

#### Upload Area with Progress
```tsx
{uploadingImage ? (
  <>
    <Loader2 className="animate-spin" />
    <p>{uploadProgress.current} / {uploadProgress.total} rasm</p>
    <ProgressBar />
  </>
) : (
  <Upload icon and text />
)}
```

#### Max Limit Warning
```tsx
{pitch.images.length >= MAX_IMAGES && (
  <div className="warning">
    Maksimal rasm soni ga yetdi...
  </div>
)}
```

### 5. Constraints & Validation

**Maximum Images:** 8 per pitch
- Enforced in frontend
- Warning shown at limit
- Upload area hidden at limit

**File Validation:**
- Type: Only images (image/*)
- Size: Max 5MB per file
- Validated before upload starts

**Owner Check:**
- All updates use `.eq('owner_id', user.id)`
- Only pitch owner can modify images

**Error Handling:**
- Failed uploads are cleaned up
- State reverts on database errors
- User-friendly error messages

### 6. Storage Management

**Bucket:** `pitch_images`

**File Naming:**
```typescript
const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
```

**Cleanup:**
- Deleted images are removed from storage
- Failed uploads are cleaned up automatically

## Testing Checklist

- [ ] Run SQL migration script
- [ ] Verify `images` column exists
- [ ] Test uploading single image
- [ ] Test uploading multiple images (2-5)
- [ ] Test upload progress indicator
- [ ] Test deleting individual images
- [ ] Test max limit (8 images)
- [ ] Test file validation (type, size)
- [ ] Test error handling
- [ ] Verify storage cleanup on delete
- [ ] Test with existing data migration

## Migration Notes

**Existing Data:**
- Old `image_url` values are automatically migrated to `images` array
- No data loss during migration
- `image_url` column can be kept for backward compatibility or dropped

**Backward Compatibility:**
- If you keep `image_url`, old code will still work
- New code uses `images` array exclusively

## Benefits

✅ Multiple images per pitch (up to 8)
✅ Better user experience with gallery view
✅ Progress tracking during upload
✅ Individual image deletion
✅ Smart upload limits
✅ Automatic cleanup on errors
✅ Maintained owner security checks

## Future Enhancements

- Drag & drop reordering
- Image cropping/editing
- Bulk delete
- Image compression
- Lazy loading for large galleries
