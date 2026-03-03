# Sozlamalar Sahifasi - Yangi Funksiyalar

## O'zgarishlar

### 1. Bottom Navigation
- "Maydon" → "Sozlamalar" (Settings icon bilan)
- Yanada tushunarli va professional ko'rinish

### 2. Yangi Funksiyalar

#### Maydon Qo'shish
- Header'da "+" tugmasi
- Modal oynada yangi maydon ma'lumotlarini kiritish
- Avtomatik ravishda yangi maydon tanlanadi

#### Maydon O'chirish
- Qizil "Maydonni o'chirish" tugmasi
- Tasdiqlash dialogi
- Kamida 1 ta maydon qolishi kerak (oxirgi maydonni o'chirish mumkin emas)

#### Rasm Yuklash
- Drag & drop yoki click orqali rasm yuklash
- Bir nechta rasm yuklash mumkin
- Rasmlarni ko'rish va o'chirish
- Supabase Storage'da saqlanadi

#### Ma'lumotlarni Tahrirlash
- Maydon nomi
- Soatlik narx
- Manzil
- Ish vaqti (boshlanish va tugash)
- Rasmlar

## Supabase Setup

### 1. Storage Bucket Yaratish

Supabase Dashboard'da:
1. Storage > Create bucket
2. Bucket nomi: `pitch-images`
3. Public bucket: ✓ (rasm URL'lari public bo'lishi kerak)

Yoki SQL Editor'da `storage-setup.sql` faylini ishga tushiring.

### 2. Database Schema Yangilash

Agar `images` ustuni yo'q bo'lsa, qo'shing:

```sql
-- Add images column if not exists
ALTER TABLE pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

## Foydalanish

### Yangi Maydon Qo'shish
1. Sozlamalar sahifasiga o'ting
2. O'ng yuqoridagi "+" tugmasini bosing
3. Ma'lumotlarni kiriting
4. "Qo'shish" tugmasini bosing

### Maydon Tahrirlash
1. Dropdown'dan maydonni tanlang
2. Ma'lumotlarni o'zgartiring
3. "O'zgarishlarni saqlash" tugmasini bosing

### Rasm Yuklash
1. Maydonni tanlang
2. "Rasm yuklash" qismiga rasm tortib tashlang yoki bosing
3. Rasm avtomatik yuklanadi va saqlanadi

### Rasm O'chirish
1. Rasm ustiga hover qiling
2. O'ng yuqoridagi qizil "X" tugmasini bosing

### Maydon O'chirish
1. Maydonni tanlang
2. Pastdagi qizil "Maydonni o'chirish" tugmasini bosing
3. Tasdiqlang

## Xatoliklarni Bartaraf Qilish

### Rasm yuklanmayapti
- Supabase Storage bucket yaratilganligini tekshiring
- Storage policies to'g'ri sozlanganligini tekshiring
- Rasm hajmi 5MB dan kichik ekanligini tekshiring

### "bucket not found" xatosi
- `storage-setup.sql` faylini ishga tushiring
- Yoki Supabase Dashboard'da bucket yarating

### Maydon o'chirilmayapti
- Kamida 1 ta maydon qolishi kerak
- Maydon bilan bog'liq bronlar bo'lishi mumkin (CASCADE delete ishlaydi)

## Keyingi Versiyalar Uchun

- [ ] Drag & drop rasm yuklash
- [ ] Rasm crop/resize
- [ ] Ko'p rasmni bir vaqtda yuklash
- [ ] Rasm tartibini o'zgartirish
- [ ] Maydon nusxasini yaratish
- [ ] Maydonni vaqtincha o'chirish (archive)
