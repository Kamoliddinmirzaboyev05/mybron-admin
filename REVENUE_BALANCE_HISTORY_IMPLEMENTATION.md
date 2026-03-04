# Daromad, Balans va Tarix Tizimi

## Sana: 2026-03-04

## Umumiy Ko'rinish

Ushbu yangilanish to'rtta asosiy funksiyani amalga oshiradi:
1. Dashboard - bugungi barcha confirmed bronlarni ko'rsatish
2. Daromad statistikasi - faqat bugungi confirmed bronlar
3. Bronlar tarixi - o'tgan va bekor qilingan bronlar
4. Profil - jami tushum va hozirgi balans

---

## 1. Dashboard Mantiqi (Vaqt Filtri) 📊

### Muammo
Dashboard faqat kelajakdagi vaqtdagi bronlarni ko'rsatar edi. Agar o'yin vaqti o'tib ketgan bo'lsa, u Dashboard'dan yo'qolar edi.

### Yechim
Bugungi barcha confirmed bronlarni ko'rsatish, vaqtidan qat'iy nazar:

```typescript
const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');

const upcomingBookings = bookings
  .filter((b) => {
    // Only confirmed or manual bookings
    if (b.status !== 'confirmed' && b.status !== 'manual') return false;
    
    // Show all bookings for today (regardless of time)
    if (b.booking_date === todayDate) return true;
    
    // Show all future bookings
    if (b.booking_date && b.booking_date > todayDate) return true;
    
    // Hide past bookings
    return false;
  })
```

### Xatti-harakat

**Bugungi bronlar (2026-03-04):**
- ✅ 08:00-09:00 bron (o'tgan) - ko'rinadi
- ✅ 15:00-16:00 bron (hozir) - ko'rinadi
- ✅ 20:00-21:00 bron (kelajak) - ko'rinadi

**Kecha (2026-03-03):**
- ❌ Barcha bronlar yashirilgan

**Ertaga (2026-03-05):**
- ✅ Barcha bronlar ko'rinadi

### Natija
Bugungi barcha confirmed bronlar kun yakunigacha (23:59) Dashboard'da turadi.

---

## 2. Daromad Statistikasi 💰

### "Bugungi daromad" Qutisi

**Hisoblash:**
```typescript
const todayBookings = uniqueBookings.filter(
  (b) => (b.status === 'confirmed' || b.status === 'manual') && 
         b.booking_date === todayDate
);

const revenue = todayBookings.reduce((sum, booking) => {
  if (booking.total_price) {
    return sum + booking.total_price;
  }
  // Fallback: calculate from duration
  const duration = (endMinutes - startMinutes) / 60;
  return sum + (duration * (booking.pitches?.price_per_hour || 0));
}, 0);
```

**Qaysi bronlar hisoblanadi:**
- ✅ `status: 'confirmed'` va `booking_date: bugun`
- ✅ `status: 'manual'` va `booking_date: bugun`
- ❌ `status: 'pending'` - hisoblanmaydi
- ❌ `status: 'cancelled'` - hisoblanmaydi
- ❌ Kecha yoki ertangi bronlar - hisoblanmaydi

### "Band qilingan soatlar" Qutisi

**Hisoblash:**
```typescript
const hours = todayBookings.reduce((sum, booking) => {
  const [startHour, startMin] = booking.start_time.split(':').map(Number);
  const [endHour, endMin] = booking.end_time.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationHours = (endMinutes - startMinutes) / 60;
  
  return sum + durationHours;
}, 0);
```

**Misol:**
- Bron 1: 08:00-10:00 = 2 soat
- Bron 2: 15:00-16:00 = 1 soat
- Bron 3: 20:00-22:00 = 2 soat
- **Jami: 5 soat**

---

## 3. Bronlar Tarixi (History Tab) 📜

### Yangi Tab Tizimi

#### "Hammasi" Tab
Barcha bronlarni ko'rsatadi (filtersiz)

#### "Kutilmoqda" Tab
```typescript
if (filter === 'pending') {
  return booking.status === 'pending';
}
```
Faqat `status: 'pending'` bronlar

#### "Tasdiqlangan" Tab
```typescript
if (filter === 'confirmed') {
  const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
  
  return (booking.status === 'confirmed' || booking.status === 'manual') &&
         booking.booking_date && booking.booking_date >= todayDateUZ;
}
```
**Ko'rsatadi:**
- ✅ Bugungi confirmed/manual bronlar
- ✅ Kelajakdagi confirmed/manual bronlar

**Ko'rsatmaydi:**
- ❌ O'tgan kunlardagi bronlar

#### "Tarix" Tab (Yangi!)
```typescript
if (filter === 'history') {
  const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
  
  return booking.status === 'cancelled' || 
         booking.status === 'rejected' ||
         (booking.booking_date && booking.booking_date < todayDateUZ);
}
```

**Ko'rsatadi:**
- ✅ `status: 'cancelled'` bronlar
- ✅ `status: 'rejected'` bronlar
- ✅ O'tgan kunlardagi barcha bronlar

### "Tugallangan" Status Badge

**Mantiq:**
```typescript
const isCompleted = bookingDate && bookingDate < todayDateUZ && 
                    (status === 'confirmed' || status === 'manual');

const displayStatus = isCompleted ? 'completed' : status;
```

**Ko'rinish:**
- 🟣 **Tugallangan** - o'tgan kunlardagi confirmed/manual bronlar
- 🟢 **Tasdiqlangan** - bugungi va kelajakdagi confirmed bronlar
- 🔵 **Qo'lda** - qo'lda qo'shilgan bronlar
- 🟡 **Kutilmoqda** - pending bronlar
- 🔴 **Rad etilgan** - rejected bronlar
- ⚫ **Bekor qilingan** - cancelled bronlar

---

## 4. Profil va Umumiy Balans 👤

### Yangi Ma'lumotlar

Profil sahifasiga ikkita yangi kartochka qo'shildi:

#### Jami Tushum (Total Revenue)
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('total_revenue, balance')
  .eq('id', user.id)
  .single();
```

**Ko'rinish:**
```
┌─────────────────────┐
│ 💵 Jami tushum      │
│ 1,500,000 so'm      │
└─────────────────────┘
```

**Rang:** Yashil gradient (green-900/30 to green-950/50)

#### Hozirgi Balans (Current Balance)
**Ko'rinish:**
```
┌─────────────────────┐
│ 💼 Hozirgi balans   │
│ 750,000 so'm        │
└─────────────────────┘
```

**Rang:** Ko'k gradient (blue-900/30 to blue-950/50)

### Kartochka Dizayni

```typescript
<div className="grid grid-cols-2 gap-3">
  {/* Jami tushum */}
  <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 border border-green-800/50 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <DollarSign className="w-5 h-5 text-green-400" />
      <p className="text-xs text-green-300">Jami tushum</p>
    </div>
    <p className="text-2xl font-bold text-white">
      {profileData.total_revenue.toLocaleString()} 
      <span className="text-sm text-green-300">so'm</span>
    </p>
  </div>

  {/* Hozirgi balans */}
  <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Wallet className="w-5 h-5 text-blue-400" />
      <p className="text-xs text-blue-300">Hozirgi balans</p>
    </div>
    <p className="text-2xl font-bold text-white">
      {profileData.balance.toLocaleString()} 
      <span className="text-sm text-blue-300">so'm</span>
    </p>
  </div>
</div>
```

### Loading State
Ma'lumotlar yuklanayotganda spinner ko'rsatiladi:
```typescript
{loadingProfile ? (
  <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
) : (
  <p className="text-2xl font-bold text-white">
    {profileData.total_revenue.toLocaleString()} so'm
  </p>
)}
```

---

## O'zgartirilgan Fayllar

### 1. `src/app/components/DashboardPage.tsx`
**O'zgarishlar:**
- Vaqt filtrini olib tashlandi
- Bugungi barcha confirmed bronlarni ko'rsatish
- Uzbekistan vaqti bilan ishlash

**Qo'shilgan:**
```typescript
// Show all bookings for today (regardless of time)
if (b.booking_date === todayDate) return true;
```

### 2. `src/app/components/BookingsPage.tsx`
**O'zgarishlar:**
- "Tasdiqlangan" tab - faqat bugungi va kelajakdagi bronlar
- "Tarix" tab - o'tgan va bekor qilingan bronlar
- "Tugallangan" status badge qo'shildi

**Qo'shilgan:**
```typescript
const isCompleted = bookingDate && bookingDate < todayDateUZ && 
                    (status === 'confirmed' || status === 'manual');
```

### 3. `src/app/components/ProfilePage.tsx`
**Qo'shilgan:**
- `total_revenue` va `balance` ma'lumotlarini fetch qilish
- Ikkita yangi kartochka (gradient dizayn)
- Loading state
- Console logging

**Yangi importlar:**
```typescript
import { supabase } from '../../lib/supabase';
import { DollarSign, Wallet } from 'lucide-react';
```

---

## Database Schema

### `profiles` jadvali
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_revenue NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  -- other fields...
);
```

### `bookings` jadvali
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price NUMERIC,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'manual', 'rejected', 'cancelled')),
  -- other fields...
);
```

---

## Console Logging

### Dashboard
```
📊 BOOKINGS DEBUG:
Current date (Uzbekistan): 2026-03-04
Total bookings: 10
Pending bookings: 2
Upcoming bookings (today + future): 8
```

### Bronlar Sahifasi
```
🔍 BRONLAR PAGE: Filter applied
Current filter: history
Filtered bookings count: 3
```

### Profil
```
💰 PROFILE DATA: {total_revenue: 1500000, balance: 750000}
```

---

## Test Checklist

### Dashboard
- [x] Bugungi barcha confirmed bronlar ko'rinadi
- [x] O'tgan vaqtdagi bugungi bronlar ko'rinadi
- [x] Kelajakdagi bronlar ko'rinadi
- [x] Kechagi bronlar ko'rinmaydi
- [x] Uzbekistan vaqti ishlatiladi

### Statistika
- [x] Faqat bugungi confirmed bronlar hisoblanadi
- [x] total_price ishlatiladi
- [x] Soatlar to'g'ri hisoblanadi
- [x] Pending bronlar hisoblanmaydi

### Bronlar Tarixi
- [x] "Tasdiqlangan" - faqat bugungi va kelajakdagi
- [x] "Tarix" - o'tgan va bekor qilingan
- [x] "Tugallangan" badge o'tgan bronlarda
- [x] Status ranglari to'g'ri

### Profil
- [x] total_revenue ko'rsatiladi
- [x] balance ko'rsatiladi
- [x] Loading state ishlaydi
- [x] Gradient dizayn to'g'ri
- [x] Raqamlar formatlangan (1,500,000)

---

## Foydalanuvchi Tajribasi

### Oldin
- ❌ O'tgan vaqtdagi bugungi bronlar yo'qolar edi
- ❌ Statistika noaniq edi
- ❌ O'tgan bronlarni topish qiyin edi
- ❌ Jami daromadni ko'rish imkoni yo'q edi

### Keyin
- ✅ Bugungi barcha bronlar kun yakunigacha ko'rinadi
- ✅ Aniq daromad statistikasi
- ✅ "Tarix" tabida barcha o'tgan bronlar
- ✅ "Tugallangan" status o'tgan bronlar uchun
- ✅ Profilda jami tushum va balans
- ✅ Chiroyli gradient kartochkalar

---

## Texnik Eslatmalar

### Sana Formati
Barcha sanalar `YYYY-MM-DD` formatida:
```typescript
const todayDate = format(uzbekistanTime, 'yyyy-MM-dd'); // '2026-03-04'
```

### Vaqt Zonasi
Barcha vaqt operatsiyalari Uzbekistan vaqti bilan:
```typescript
const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
```

### Raqam Formatlash
Barcha pul miqdorlari formatlangan:
```typescript
{profileData.total_revenue.toLocaleString()} // 1,500,000
```

### Status Prioriteti
O'tgan bronlar uchun status prioriteti:
1. Agar `booking_date < today` va `status = confirmed/manual` → "Tugallangan"
2. Aks holda asl statusni ko'rsat

---

## Kelajakdagi Yaxshilashlar

1. **Avtomatik Balans Yangilash**
   - Har safar bron tasdiqlanganda `total_revenue` va `balance` avtomatik yangilansin

2. **Grafik va Diagrammalar**
   - Kunlik/haftalik/oylik daromad grafigi
   - Eng ko'p band qilingan vaqtlar diagrammasi

3. **Eksport Funksiyasi**
   - Tarix tabidan Excel/PDF eksport
   - Moliyaviy hisobotlar

4. **Filter va Qidiruv**
   - Tarix tabida sana bo'yicha filter
   - Mijoz nomi bo'yicha qidiruv

5. **Statistika Kengaytirish**
   - O'rtacha bron narxi
   - Eng faol mijozlar
   - Haftalik/oylik taqqoslash
