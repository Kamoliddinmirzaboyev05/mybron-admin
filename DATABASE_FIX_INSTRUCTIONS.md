# Database Fix Instructions - Admin Panel

## Muammo
Admin panelda tahrirlash (SettingsPage) va ro'yxatdan o'tish (Register) ishlamayapti. Supabase 500 xatosini qaytarmoqda.

## Sabablari
1. Database'da ustun nomlari bir xil emas (name vs full_name, price vs price_per_hour)
2. Trigger funksiyasi noto'g'ri metadata'dan o'qiyapti
3. Update so'rovlari noto'g'ri filter ishlatmoqda

## Yechim

### 1-qadam: SQL skriptni ishga tushiring

Supabase Dashboard'ga kiring:
1. Supabase loyihangizni oching
2. SQL Editor'ga o'ting (chap menyu)
3. `database-fix-complete.sql` faylini oching
4. Butun skriptni nusxalang va SQL Editor'ga joylashtiring
5. "Run" tugmasini bosing

**Muhim:** Skript quyidagilarni bajaradi:
- `profiles` jadvalida `name` → `full_name` ga o'zgartiradi
- `pitches` jadvaliga kerakli ustunlarni qo'shadi:
  - `image_url` (TEXT)
  - `price_per_hour` (DECIMAL)
  - `latitude` (FLOAT8)
  - `longitude` (FLOAT8)
  - `landmark` (TEXT)
- Eski ma'lumotlarni yangi ustunlarga ko'chiradi
- `handle_new_user()` trigger funksiyasini qayta yaratadi
- RLS (Row Level Security) policy'larini yangilaydi

### 2-qadam: React kodini yangilash

**Quyidagi fayllar avtomatik yangilandi:**

#### `src/contexts/AuthContext.tsx`
- ✅ `signUp` funksiyasi `full_name` va `role: 'admin'` yuboradi

#### `src/app/components/SettingsPage.tsx`
- ✅ Barcha update so'rovlari `.eq('owner_id', user.id)` ishlatadi
- ✅ To'g'ri ustun nomlari: `image_url`, `price_per_hour`, `landmark`, `latitude`, `longitude`
- ✅ `handleSave` - owner_id bo'yicha filter
- ✅ `handleImageUpload` - owner_id bo'yicha filter
- ✅ `handleRemoveImage` - owner_id bo'yicha filter

#### `src/app/components/RegisterPage.tsx`
- ✅ To'liq xatolik xabarlari console va UI'da ko'rsatiladi

### 3-qadam: Tekshirish

SQL Editor'da quyidagi so'rovlarni ishga tushiring:

```sql
-- Profiles strukturasini tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Pitches strukturasini tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pitches';

-- Oxirgi profilelarni ko'rish
SELECT id, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Oxirgi pitchlarni ko'rish
SELECT id, owner_id, name, price_per_hour, image_url, is_active 
FROM pitches 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4-qadam: Ilovani test qilish

1. **Ro'yxatdan o'tishni test qiling:**
   - Register sahifasiga o'ting
   - Email, parol va ism kiriting
   - "Ro'yxatdan o'tish" tugmasini bosing
   - Muvaffaqiyatli bo'lsa, Dashboard'ga yo'naltirilasiz
   - Xatolik bo'lsa, aniq xatolik xabari ko'rsatiladi

2. **Sozlamalar sahifasini test qiling:**
   - Sozlamalar sahifasiga o'ting
   - Maydon ma'lumotlarini tahrirlang
   - Rasm yuklang
   - "O'zgarishlarni saqlash" tugmasini bosing
   - Ma'lumotlar saqlanishi kerak

## Xatoliklarni bartaraf qilish

### Agar ro'yxatdan o'tish ishlamasa:

1. Browser console'ni oching (F12)
2. Xatolik xabarini ko'ring
3. SQL Editor'da trigger'ni tekshiring:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### Agar tahrirlash ishlamasa:

1. Browser console'ni oching
2. Network tab'da so'rovlarni ko'ring
3. Xatolik 403 bo'lsa - RLS policy muammosi
4. Xatolik 500 bo'lsa - ustun nomi muammosi

### RLS Policy'larni tekshirish:

```sql
SELECT * FROM pg_policies WHERE tablename = 'pitches';
```

## Qo'shimcha yordam

Agar muammo hal bo'lmasa:
1. Supabase logs'ni tekshiring (Dashboard → Logs)
2. Database logs'ni ko'ring
3. Auth logs'ni ko'ring

## Muvaffaqiyat!

Agar barcha qadamlar to'g'ri bajarilsa:
- ✅ Ro'yxatdan o'tish ishlaydi
- ✅ Avtomatik profile va pitch yaratiladi
- ✅ Sozlamalar sahifasida tahrirlash ishlaydi
- ✅ Rasm yuklash ishlaydi
- ✅ Barcha ma'lumotlar to'g'ri saqlanadi
