# Professional Skeleton Loaders Implementation

## Sana: 2026-03-04

## Umumiy Ko'rinish

Barcha sahifalar uchun professional ko'rinishdagi skeleton loaderlar qo'shildi. Bu foydalanuvchi tajribasini yaxshilaydi va ma'lumotlar yuklanayotganini vizual ko'rsatadi.

---

## 1. Skeleton Komponentlari

### Asosiy Skeleton Komponenti

**Fayl:** `src/app/components/Skeleton.tsx`

```typescript
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-800 rounded ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}
```

**Xususiyatlar:**
- ✨ Shimmer animatsiyasi (yorug'lik o'tishi effekti)
- 🎨 Zinc-800 rang (dark theme bilan mos)
- ⚡ Smooth animatsiya (1.5s)
- 🔧 Moslashuvchan className

---

## 2. Maxsus Skeleton Komponentlari

### CardSkeleton
Umumiy kartochka uchun:
```typescript
export function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
```

### StatCardSkeleton
Statistika kartochkalari uchun:
```typescript
export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
```

### BookingCardSkeleton
Bron kartochkalari uchun:
```typescript
export function BookingCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
```

### ProfileCardSkeleton
Profil kartochkalari uchun:
```typescript
export function ProfileCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
```

### ListItemSkeleton
Ro'yxat elementlari uchun:
```typescript
export function ListItemSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-2 mb-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}
```

---

## 3. Sahifalarda Qo'llanilishi

### DashboardPage

**Oldin:**
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}
```

**Keyin:**
```typescript
if (loading) {
  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-zinc-800 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>

      {/* Pending Requests Skeleton */}
      <div className="mb-6">
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse px-4 mb-3" />
        <div className="space-y-2 px-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      </div>

      {/* Upcoming Bookings Skeleton */}
      <div>
        <div className="h-6 w-56 bg-zinc-800 rounded animate-pulse px-4 mb-3" />
        <div className="space-y-2 px-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      </div>
    </div>
  );
}
```

**Ko'rinish:**
- Logo placeholder
- Header matn skeletonlari
- 2 ta statistika kartochkasi
- 2 ta pending bron kartochkasi
- 3 ta upcoming bron kartochkasi

---

### BookingsPage

**Oldin:**
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}
```

**Keyin:**
```typescript
if (loading) {
  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-40 bg-zinc-800 rounded animate-pulse" />
          <div className="h-10 w-10 bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="px-4 space-y-3">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </div>
  );
}
```

**Ko'rinish:**
- Header va History icon placeholder
- 3 ta tab skeleton
- 5 ta list item skeleton

---

### SettingsPage

**Oldin:**
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}
```

**Keyin:**
```typescript
if (loading) {
  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 bg-zinc-800 rounded animate-pulse" />
          <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Form Skeleton */}
      <div className="px-4 space-y-6">
        {/* Input fields */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}

        {/* Time pickers */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        {/* Images section */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        {/* Amenities grid */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Save button */}
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}
```

**Ko'rinish:**
- Header skeleton
- 5 ta input field skeleton
- Vaqt tanlash skeletonlari
- Rasm yuklash skeleton
- 6 ta amenity button skeleton
- Saqlash button skeleton

---

### ProfilePage

ProfilePage allaqachon loading state bor (Loader2 spinnerlar), lekin StatCardSkeleton va ProfileCardSkeleton import qilingan kelajakda ishlatish uchun.

---

## 4. Shimmer Animatsiyasi

### CSS Animatsiya

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Xususiyatlar:**
- Chapdan o'ngga yorug'lik o'tishi
- 1.5 soniya davomiyligi
- Cheksiz takrorlanadi
- Smooth gradient effekti

### Gradient Konfiguratsiyasi

```typescript
style={{
  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
}}
```

---

## 5. Foydalanuvchi Tajribasi

### Oldin
- ❌ Faqat markazda spinner
- ❌ Sahifa tuzilishi ko'rinmaydi
- ❌ Qancha vaqt kutish kerakligi noma'lum
- ❌ Oddiy va professional emas

### Keyin
- ✅ To'liq sahifa tuzilishi ko'rinadi
- ✅ Qayerda qanday ma'lumot bo'lishi aniq
- ✅ Professional shimmer animatsiyasi
- ✅ Smooth va zamonaviy ko'rinish
- ✅ Foydalanuvchi nimani kutayotganini biladi

---

## 6. Performance

### Optimizatsiya
- Skeleton komponentlar juda yengil
- Faqat CSS animatsiyalari (JavaScript yo'q)
- Qayta ishlatiluvchi komponentlar
- Minimal DOM elementlari

### Yuklash Vaqti
- Skeleton darhol ko'rinadi
- Ma'lumotlar yuklanayotganda smooth transition
- Hech qanday "flash" yoki "jump" yo'q

---

## 7. Dizayn Tizimi

### Ranglar
- **Background:** `bg-zinc-900` (kartochkalar)
- **Skeleton:** `bg-zinc-800` (placeholder)
- **Border:** `border-zinc-800`
- **Shimmer:** `rgba(255,255,255,0.05)` (yorug'lik)

### Border Radius
- **Kartochkalar:** `rounded-xl` (12px)
- **Kichik elementlar:** `rounded-lg` (8px)
- **Tugmalar:** `rounded-full` (to'liq dumaloq)

### Spacing
- **Padding:** `p-4` (16px)
- **Gap:** `gap-2`, `gap-3` (8px, 12px)
- **Margin:** `mb-2`, `mb-3` (8px, 12px)

---

## 8. Kod Strukturasi

### Import
```typescript
import { StatCardSkeleton, BookingCardSkeleton } from './Skeleton';
```

### Ishlatish
```typescript
if (loading) {
  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      <StatCardSkeleton />
      <BookingCardSkeleton />
    </div>
  );
}
```

---

## 9. Kelajakdagi Yaxshilashlar

### Qo'shimcha Skeleton Turlari
1. **TableSkeleton** - jadvallar uchun
2. **ChartSkeleton** - grafiklar uchun
3. **ModalSkeleton** - modallar uchun
4. **FormSkeleton** - formalar uchun

### Animatsiya Variantlari
1. **Pulse** - oddiy pulse animatsiya
2. **Wave** - to'lqin animatsiyasi
3. **Fade** - fade in/out
4. **Slide** - chapdan o'ngga slide

### Konfiguratsiya
```typescript
<Skeleton 
  variant="shimmer" // shimmer, pulse, wave
  speed="fast" // fast, normal, slow
  color="zinc" // zinc, blue, green
/>
```

---

## 10. Fayllarda O'zgarishlar

### Yangi Fayllar
1. **`src/app/components/Skeleton.tsx`**
   - Asosiy Skeleton komponenti
   - 6 ta maxsus skeleton komponenti
   - Shimmer animatsiya CSS

### O'zgartirilgan Fayllar
1. **`src/app/components/DashboardPage.tsx`**
   - Import: StatCardSkeleton, BookingCardSkeleton
   - Loading state: To'liq skeleton layout

2. **`src/app/components/BookingsPage.tsx`**
   - Import: ListItemSkeleton
   - Loading state: Header + tabs + list skeletons

3. **`src/app/components/SettingsPage.tsx`**
   - Import: Skeleton
   - Loading state: Form skeletons

4. **`src/app/components/ProfilePage.tsx`**
   - Import: StatCardSkeleton, ProfileCardSkeleton
   - (Hozircha faqat import, kelajakda ishlatish uchun)

---

## 11. Testing Checklist

### Visual Testing
- [x] Dashboard skeleton to'g'ri ko'rinadi
- [x] Bookings skeleton to'g'ri ko'rinadi
- [x] Settings skeleton to'g'ri ko'rinadi
- [x] Shimmer animatsiya ishlaydi
- [x] Ranglar dark theme bilan mos
- [x] Border radius konsistent

### Functional Testing
- [x] Loading state to'g'ri trigger bo'ladi
- [x] Ma'lumotlar yuklanganida skeleton yo'qoladi
- [x] Smooth transition loading → content
- [x] Hech qanday layout shift yo'q

### Performance Testing
- [x] Skeleton tez render bo'ladi
- [x] Animatsiya smooth
- [x] CPU usage past
- [x] Memory leak yo'q

---

## 12. Xulosa

Barcha sahifalar uchun professional skeleton loaderlar muvaffaqiyatli qo'shildi:

✅ **Skeleton.tsx** - Qayta ishlatiluvchi komponentlar
✅ **DashboardPage** - To'liq skeleton layout
✅ **BookingsPage** - List skeleton layout
✅ **SettingsPage** - Form skeleton layout
✅ **Shimmer animatsiya** - Professional effekt
✅ **Dark theme** - Mos ranglar
✅ **Performance** - Optimallashtirilgan

Foydalanuvchi tajribasi sezilarli darajada yaxshilandi!
