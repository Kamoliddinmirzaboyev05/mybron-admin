# Amenities (Qulayliklar) Management System

## Overview
This system allows admins to select and manage amenities (facilities) for their pitch. Users can see these amenities when viewing pitch details.

## Database Schema

### Column: `amenities`
- Type: `TEXT[]` (text array)
- Default: `'{}'` (empty array)
- Stores amenity names in Uzbek

**SQL Migration:**
```sql
ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
```

## Predefined Amenities List

| ID | Name (Uzbek) | Icon | Description |
|---|---|---|---|
| dush | Dush | Droplets | Shower facilities |
| parkovka | Parkovka | Car | Parking area |
| kiyim | Kiyim almashtirish xonasi | ShirtIcon | Changing room |
| kafeteriy | Kafeteriy | Coffee | Cafeteria |
| yoritish | Kechki yoritish | Lightbulb | Night lighting |
| tribuna | Tribuna | Users | Spectator stands |
| inventar | Inventar (to'p/forma) | CircleDot | Equipment rental |

## Implementation

### 1. Data Structure (SettingsPage.tsx)

```typescript
const AMENITIES = [
  { id: 'dush', name: 'Dush', icon: Droplets },
  { id: 'parkovka', name: 'Parkovka', icon: Car },
  { id: 'kiyim', name: 'Kiyim almashtirish xonasi', icon: ShirtIcon },
  { id: 'kafeteriy', name: 'Kafeteriy', icon: Coffee },
  { id: 'yoritish', name: 'Kechki yoritish', icon: Lightbulb },
  { id: 'tribuna', name: 'Tribuna', icon: Users },
  { id: 'inventar', name: "Inventar (to'p/forma)", icon: CircleDot },
];

interface Pitch {
  // ... other fields
  amenities: string[];
}
```

### 2. Toggle Function

```typescript
const toggleAmenity = (amenityName: string) => {
  if (!pitch) return;
  
  const currentAmenities = pitch.amenities || [];
  const isSelected = currentAmenities.includes(amenityName);
  
  const updatedAmenities = isSelected
    ? currentAmenities.filter(a => a !== amenityName)
    : [...currentAmenities, amenityName];
  
  setPitch(prev => prev ? { ...prev, amenities: updatedAmenities } : null);
};
```

### 3. Save to Database

```typescript
const { error } = await supabase
  .from('pitches')
  .update({
    // ... other fields
    amenities: pitch.amenities,
  })
  .eq('owner_id', user.id);
```

## UI Components

### Admin Panel (SettingsPage)

**Grid Layout:**
- 2 columns on desktop
- Responsive on mobile
- Toggle buttons with icons

**Button States:**

**Unselected:**
```
┌─────────────────────────┐
│ 🚿  Dush                │
│ (gray background)       │
└─────────────────────────┘
```

**Selected:**
```
┌─────────────────────────┐
│ 🚿  Dush            ⚪  │
│ (blue background)       │
└─────────────────────────┘
```

**Features:**
- Icon in rounded square
- Amenity name
- Check indicator when selected
- Smooth transitions
- Hover effects

### User App Display (Future)

**Chip Style:**
```tsx
<div className="flex flex-wrap gap-2">
  {amenities.map(amenity => (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-full">
      <Icon className="w-4 h-4 text-blue-600" />
      <span className="text-sm text-blue-900">{amenity}</span>
    </div>
  ))}
</div>
```

## Styling

### Selected State
```css
bg-blue-600 
border-blue-600 
text-white 
shadow-lg shadow-blue-600/20
```

### Unselected State
```css
bg-zinc-900 
border-zinc-800 
text-zinc-400 
hover:border-zinc-700
```

### Icon Container
```css
/* Selected */
bg-blue-700

/* Unselected */
bg-zinc-800
```

## User Experience

### Admin Panel
1. Click amenity button to toggle
2. Selected amenities show blue background
3. White check indicator appears
4. Counter shows "X ta qulaylik tanlandi"
5. Save button updates database

### User App (Future Implementation)
1. View amenities as chips
2. Icons make them recognizable
3. Clean, modern design
4. Easy to scan

## Benefits

✅ Easy to select/deselect amenities
✅ Visual feedback with colors and icons
✅ Stored as array in database
✅ Flexible - easy to add new amenities
✅ Professional UI design
✅ Mobile responsive

## Future Enhancements

- Custom amenities (user-defined)
- Amenity descriptions
- Amenity categories
- Search/filter by amenities
- Popular amenities badge
- Amenity availability status

## Testing Checklist

- [ ] Run SQL migration
- [ ] Verify amenities column exists
- [ ] Test selecting amenities
- [ ] Test deselecting amenities
- [ ] Test saving to database
- [ ] Verify data persists after refresh
- [ ] Test with no amenities selected
- [ ] Test with all amenities selected
- [ ] Check mobile responsiveness
- [ ] Verify icons display correctly

## Example Usage

**Admin selects amenities:**
```
✓ Dush
✓ Parkovka
✓ Kechki yoritish
```

**Saved to database:**
```json
{
  "amenities": ["Dush", "Parkovka", "Kechki yoritish"]
}
```

**Displayed to users:**
```
🚿 Dush  🚗 Parkovka  💡 Kechki yoritish
```
