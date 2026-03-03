# Qo'lda Band Qilish Tizimi - To'liq Implementatsiya

## Database O'zgarishlari

### 1. Bookings Jadvalini Yangilash
Fayl: `update-bookings-schema.sql`

**Qo'shilgan ustunlar:**
- `total_price` - Jami narx (davomiylik × soatlik_narx)
- `booking_date` - Sana (start_time dan avtomatik)

**Trigger:**
- `tr_check_booking_overlap` - Overlap tekshirish
- Xato xabari: "Ushbu vaqt oralig'ida allaqachon bron mavjud!"

**Overlap Logikasi:**
```sql
N_Start < E_End AND N_End > E_Start
```

### 2. Pitches Jadvalini Yangilash
Fayl: `add-owner-and-price-columns.sql`

**Qo'shilgan ustunlar:**
- `owner_id` - Maydon egasi (auth.users ga bog'langan)
- `price_per_hour` - Soatlik narx

**RLS Policies:**
- Foydalanuvchilar faqat o'z maydonlarini ko'rishi va boshqarishi mumkin

## Frontend Implementatsiya

### ManualBookingModal Komponenti

**Yangi funksiyalar:**

1. **Form Validation**
   - Barcha maydonlar to'ldirilganligini tekshirish
   - Telefon raqami formati: `+998 XX XXX XX XX`
   - Trim() bilan bo'sh joylarni olib tashlash

2. **Narx Hisoblash**
   ```typescript
   davomiylik = (end_time - start_time) / (1000 * 60 * 60)  // ms → soat
   jami_narx = davomiylik × pitch.price_per_hour
   ```

3. **Database Integration**
   ```typescript
   const bookingData = {
     pitch_id: pitch.id,
     customer_name: customerName.trim(),
     customer_phone: customerPhone.trim(),
     start_time: selectedTimeSlot.start.toISOString(),
     end_time: selectedTimeSlot.end.toISOString(),
     booking_date: format(selectedDate, 'yyyy-MM-dd'),
     total_price: totalPrice,
     status: 'confirmed',
   };
   ```

4. **Error Handling**
   - Database trigger xatolarini ushlash
   - Overlap xatosini aniqlash va ko'rsatish
   - Toast notification bilan foydalanuvchiga xabar berish

5. **Success Flow**
   ```typescript
   // Success toast ko'rsatish
   setToast({ message: 'Bron muvaffaqiyatli saqlandi!', type: 'success' });
   
   // 1 soniya kutish (toast ko'rinishi uchun)
   setTimeout(() => {
     onSuccess(); // Modal yopish va dashboard yangilash
   }, 1000);
   ```

### Toast Notification

**Xato xabarlari:**
- ❌ "Iltimos barcha maydonlarni to'ldiring"
- ❌ "Telefon raqami noto'g'ri formatda"
- ❌ "Ushbu vaqt oralig'ida allaqachon bron mavjud!"
- ❌ "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring"

**Muvaffaqiyat xabari:**
- ✅ "Bron muvaffaqiyatli saqlandi!"

## Dashboard Yangilanishi

### DashboardPage Komponenti

**Realtime Subscription:**
```typescript
const subscribeToBookings = () => {
  const channel = supabase
    .channel('bookings-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookings' },
      () => {
        fetchBookings(); // Avtomatik yangilash
      }
    )
    .subscribe();
};
```

**Statistika Hisoblash:**
1. **Bugungi daromad:**
   ```typescript
   revenue = SUM(total_price) yoki SUM(davomiylik × price_per_hour)
   ```

2. **Band qilingan soatlar:**
   ```typescript
   hours = SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
   ```

**Bronlar ro'yxati:**
- Davomiylik ko'rsatish: "18:00 - 20:00 (2 soat)"
- Status badge: Tasdiqlangan (yashil)
- Realtime yangilanish

## Installation

### 1. Database Migration

```bash
# Supabase SQL Editor da ketma-ket ishga tushiring:

# 1. Pitches jadvalini yangilash
psql -f add-owner-and-price-columns.sql

# 2. Bookings jadvalini yangilash
psql -f update-bookings-schema.sql
```

### 2. Mavjud Ma'lumotlarni Yangilash

```sql
-- Agar owner_id bo'sh bo'lsa, birinchi foydalanuvchiga biriktiring
UPDATE pitches 
SET owner_id = (SELECT id FROM auth.users LIMIT 1)
WHERE owner_id IS NULL;

-- Agar price_per_hour bo'sh bo'lsa, price dan nusxalang
UPDATE pitches 
SET price_per_hour = price 
WHERE price_per_hour IS NULL;
```

## Test Qilish

### 1. Oddiy Bron (1 soat)
1. Dashboard → "+" tugmasi
2. Sana: Bugun
3. Vaqt: 18:00 - 19:00
4. Mijoz: "Test User"
5. Telefon: "+998 90 123 45 67"
6. Saqlash
7. ✅ "Bron muvaffaqiyatli saqlandi!" ko'rinishi kerak
8. Dashboard yangilanishi kerak

### 2. Ko'p Soatlik Bron (3 soat)
1. Vaqt: 18:00 - 21:00 (3 soat)
2. Narx: 3 × soatlik_narx ko'rinishi kerak
3. Saqlash
4. Dashboard da "3 soat" ko'rinishi kerak

### 3. Overlap Test
1. 18:00 - 20:00 band qiling
2. 19:00 - 21:00 band qilishga harakat qiling
3. ❌ "Ushbu vaqt oralig'ida allaqachon bron mavjud!" ko'rinishi kerak
4. Modal ochiq qolishi kerak

### 4. Validation Test
1. Bo'sh maydonlar bilan saqlashga harakat qiling
2. ❌ "Iltimos barcha maydonlarni to'ldiring"
3. Noto'g'ri telefon: "123456"
4. ❌ "Telefon raqami noto'g'ri formatda"

### 5. Realtime Test
1. Birinchi tab da bron yarating
2. Ikkinchi tab da dashboard ochiq bo'lsin
3. Ikkinchi tab avtomatik yangilanishi kerak

## Xususiyatlar

✅ To'liq form validation
✅ Telefon raqami formati tekshirish
✅ Avtomatik narx hisoblash
✅ Database trigger bilan overlap validation
✅ Toast notification (success/error)
✅ Realtime dashboard yangilanishi
✅ User-friendly error messages
✅ Loading states
✅ Responsive design
✅ Accessibility support

## Fayllar

**Database:**
- `update-bookings-schema.sql` - Bookings jadvali va trigger
- `add-owner-and-price-columns.sql` - Pitches jadvali yangilanishi

**Frontend:**
- `src/app/components/ManualBookingModal.tsx` - Asosiy modal
- `src/app/components/TimeSlotSheet.tsx` - Vaqt tanlash
- `src/app/components/Toast.tsx` - Notification
- `src/app/components/DashboardPage.tsx` - Dashboard

## Troubleshooting

**Muammo:** "Maydon topilmadi" xatosi
**Yechim:** 
```sql
-- Pitches jadvaliga owner_id qo'shing
UPDATE pitches SET owner_id = (SELECT id FROM auth.users LIMIT 1);
```

**Muammo:** Overlap trigger ishlamayapti
**Yechim:**
```sql
-- Trigger ni qayta yarating
DROP TRIGGER IF EXISTS tr_check_booking_overlap ON bookings;
-- Keyin update-bookings-schema.sql ni qayta ishga tushiring
```

**Muammo:** Dashboard yangilanmayapti
**Yechim:**
```sql
-- Realtime ni yoqing
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

## API Reference

### Booking Insert
```typescript
supabase.from('bookings').insert({
  pitch_id: string,
  customer_name: string,
  customer_phone: string,
  start_time: string (ISO),
  end_time: string (ISO),
  booking_date: string (YYYY-MM-DD),
  total_price: number,
  status: 'confirmed'
})
```

### Error Responses
```typescript
// Overlap error
{
  message: "Ushbu vaqt oralig'ida allaqachon bron mavjud!"
}

// Validation error
{
  message: "new row violates check constraint..."
}
```
