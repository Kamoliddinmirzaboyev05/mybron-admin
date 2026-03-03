# Ko'p Soatlik Band Qilish Tizimi

## O'zgarishlar

### 1. Database Schema
- `bookings` jadvaliga `total_price` ustuni qo'shildi
- Narx avtomatik hisoblanadi: `davomiylik (soat) × soatlik_narx`
- Migration fayl: `add-total-price-column.sql`

### 2. TimeSlotSheet Komponenti
**Yangi funksiyalar:**
- Har bir slot "20:00 - 21:00" formatida ko'rsatiladi
- Admin bir nechta ketma-ket slotlarni tanlashi mumkin
- Tanlangan slotlar ko'k rangda belgilanadi
- Headerda tanlangan soatlar soni ko'rsatiladi
- Tasdiqlash tugmasi tanlangan vaqt oralig'ini ko'rsatadi

**Ishlash tartibi:**
1. Birinchi slotni bosing (masalan, 18:00 - 19:00)
2. Oxirgi slotni bosing (masalan, 20:00 - 21:00)
3. Oradagi barcha slotlar avtomatik tanlanadi
4. "Tasdiqlash" tugmasini bosing

### 3. ManualBookingModal Komponenti
**Yangi funksiyalar:**
- Vaqt tanlangandan keyin davomiylik va jami narx ko'rsatiladi
- Advanced overlap validation: `N_Start < E_End AND N_End > E_Start`
- Agar overlap bo'lsa: "Bu vaqt oralig'ida boshqa bron bor!" xabari
- `total_price` database ga saqlanadi

**Narx hisoblash:**
```typescript
davomiylik = (end_time - start_time) / 3600000  // millisekund → soat
jami_narx = davomiylik × pitch.price_per_hour
```

### 4. DashboardPage Komponenti
**Yangi funksiyalar:**
- "Band qilingan soatlar" kartasi jami soatlarni ko'rsatadi (faqat soni emas)
- Har bir bronda davomiylik ko'rsatiladi: "18:00 - 20:00 (2 soat)"
- Daromad `total_price` dan yoki davomiylik × narx dan hisoblanadi

**Statistika hisoblash:**
```typescript
jami_soatlar = SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
jami_daromad = SUM(total_price) yoki SUM(davomiylik × price_per_hour)
```

### 5. BookingsPage Komponenti
**Yangi funksiyalar:**
- Har bir bronda davomiylik ko'rsatiladi
- Format: "03 Mar, 18:00 - 20:00 (2 soat)"

## Overlap Validation Logikasi

Yangi bron (N) mavjud bron (E) bilan overlap qiladi agar:
```
N_Start < E_End AND N_End > E_Start
```

**Misollar:**
- N: 18:00-20:00, E: 19:00-21:00 → OVERLAP ✗
- N: 18:00-19:00, E: 19:00-20:00 → OK ✓
- N: 18:00-22:00, E: 19:00-20:00 → OVERLAP ✗

## Database Migration

```bash
# Supabase SQL Editor da ishga tushiring:
psql -f add-total-price-column.sql
```

Yoki Supabase Dashboard → SQL Editor → yangi query → faylni nusxalang va Run.

## Test Qilish

1. **Bir soatlik bron:**
   - 18:00 - 19:00 tanlang
   - Narx: 1 × soatlik_narx
   - Saqlang va dashboard da tekshiring

2. **Ko'p soatlik bron:**
   - 18:00 - 21:00 tanlang (3 soat)
   - Narx: 3 × soatlik_narx
   - Saqlang va dashboard da "3 soat" ko'rinishini tekshiring

3. **Overlap test:**
   - 18:00 - 20:00 band qiling
   - 19:00 - 21:00 band qilishga harakat qiling
   - "Bu vaqt oralig'ida boshqa bron bor!" xabarini ko'rishingiz kerak

## Fayllar

- `src/app/components/TimeSlotSheet.tsx` - Ko'p soatlik tanlash UI
- `src/app/components/ManualBookingModal.tsx` - Narx hisoblash va overlap validation
- `src/app/components/DashboardPage.tsx` - Statistika va davomiylik ko'rsatish
- `src/app/components/BookingsPage.tsx` - Bronlar ro'yxatida davomiylik
- `add-total-price-column.sql` - Database migration

## Xususiyatlar

✅ Bir yoki ko'p soatlik band qilish
✅ Avtomatik narx hisoblash
✅ Advanced overlap validation
✅ Davomiylik ko'rsatish (dashboard va bronlar)
✅ Jami soatlar statistikasi
✅ Silliq animatsiyalar
✅ User-friendly UI
