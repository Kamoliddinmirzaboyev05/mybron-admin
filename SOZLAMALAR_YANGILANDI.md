# Sozlamalar Sahifasi - Yangilangan Versiya

## O'zgarishlar

### Olib Tashlandi
- ❌ Maydon tanlash dropdown
- ❌ Yangi maydon qo'shish modal
- ❌ Maydon o'chirish funksiyasi
- ❌ PitchPage.tsx fayli

### Qo'shildi
- ✅ Oddiy va tushunarli sozlamalar sahifasi
- ✅ Bitta maydon uchun to'liq sozlamalar
- ✅ SettingsPage.tsx yangi fayl

## Sahifa Tuzilishi

Sozlamalar sahifasi endi to'liq bitta maydon uchun:

1. **Maydon nomi** - Text input
2. **Soatlik narx** - Number input (so'm)
3. **Manzil** - Text input
4. **Ish vaqti** - 2 ta time input (boshlanish va tugash)
5. **Rasmlar** - Rasm yuklash va ko'rish
6. **Saqlash tugmasi** - O'zgarishlarni saqlash

## Xususiyatlar

### Rasm Yuklash
- Bir nechta rasm yuklash mumkin
- Maksimal hajm: 5MB
- Qo'llab-quvvatlanadigan formatlar: JPG, PNG
- Rasmni o'chirish: Rasm ustiga hover qiling va X tugmasini bosing

### Avtomatik Saqlash
- Barcha o'zgarishlar bir vaqtda saqlanadi
- Loading holati ko'rsatiladi
- Muvaffaqiyatli saqlanganda alert chiqadi

### Error Handling
- Rasm topilmasa, placeholder ko'rsatiladi
- Xatoliklar alert orqali ko'rsatiladi
- File size tekshiruvi

## Database

Sahifa database'dagi birinchi maydonni oladi:

```sql
SELECT * FROM pitches LIMIT 1;
```

Agar maydon bo'lmasa, xabar ko'rsatiladi.

## Foydalanish

1. Sozlamalar sahifasiga o'ting (Bottom nav'da 3-chi tab)
2. Ma'lumotlarni tahrirlang
3. Rasmlar yuklang (ixtiyoriy)
4. "O'zgarishlarni saqlash" tugmasini bosing

## Supabase Setup

Storage bucket yaratish kerak:

```bash
# Supabase Dashboard > Storage > Create bucket
# Bucket name: pitch-images
# Public: ✓
```

Yoki SQL Editor'da:

```sql
-- storage-setup.sql faylini ishga tushiring
```

## Keyingi Qadamlar

1. `npm run dev` - Development server
2. Supabase'da storage bucket yarating
3. Sozlamalar sahifasini test qiling
4. Rasmlar yuklang va saqlang

Hammasi tayyor! 🎉
