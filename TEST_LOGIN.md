# Login Sahifasi Test Qo'llanmasi

## Qilingan O'zgarishlar

### 1. Environment Variables
- `.env.local` faylida noto'g'ri `VITE_SUPABASE_PUBLIC_KEY` o'chirildi
- Faqat `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` qoldirildi

### 2. Supabase Konfiguratsiyasi
- `src/lib/supabase.ts` - Environment variables tekshiruvi yaxshilandi
- Agar kerakli o'zgaruvchilar bo'lmasa, xatolik chiqaradi

### 3. Login Sahifasi
- Error handling yaxshilandi
- Muvaffaqiyatli login'dan keyin avtomatik redirect qo'shildi
- Try-catch bloki qo'shildi
- Xatolik xabarlari o'zbekcha qilindi

### 4. Register Sahifasi
- Error handling yaxshilandi
- Navigation tugmalari to'g'rilandi

## Test Qilish

### 1. Development Server'ni Ishga Tushiring
```bash
npm run dev
```

### 2. Supabase'da Foydalanuvchi Yaratish

Agar sizda hali foydalanuvchi bo'lmasa, ikki yo'l bor:

**A. Supabase Dashboard orqali:**
1. https://supabase.com/dashboard ga kiring
2. Loyihangizni tanlang (qhglhdmsbhkadsczguji)
3. Authentication > Users ga o'ting
4. "Add user" tugmasini bosing
5. Email va parol kiriting

**B. Register sahifasi orqali:**
1. http://localhost:5173/register ga o'ting
2. Ism, email va parol kiriting
3. Ro'yxatdan o'ting

### 3. Login Qilish
1. http://localhost:5173/login ga o'ting
2. Email va parolni kiriting
3. "Kirish" tugmasini bosing

## Agar Login Ishlamasa

### Tekshirish Kerak Bo'lgan Narsalar:

1. **Supabase loyihasi ishlayaptimi?**
   - https://supabase.com/dashboard ga kiring
   - Loyihangiz "Active" holatida ekanligini tekshiring

2. **Database schema to'g'ri o'rnatilganmi?**
   - Supabase Dashboard > SQL Editor ga o'ting
   - `schema.sql` faylini ishga tushiring

3. **Email confirmation kerakmi?**
   - Supabase Dashboard > Authentication > Settings
   - "Enable email confirmations" o'chirilganligini tekshiring (development uchun)

4. **Browser Console'da xatolik bormi?**
   - F12 bosing
   - Console tab'ni oching
   - Qizil xatoliklarni tekshiring

## Keng Tarqalgan Muammolar

### "Invalid login credentials"
- Email yoki parol noto'g'ri
- Foydalanuvchi mavjud emasligini tekshiring

### "Email not confirmed"
- Supabase settings'da email confirmation o'chirilganligini tekshiring
- Yoki emailingizni tasdiqlang

### "Network error"
- Internet ulanishini tekshiring
- Supabase URL to'g'riligini tekshiring
- CORS muammosi bo'lishi mumkin

### Sahifa yuklanmayapti
- `npm run dev` ishga tushganligini tekshiring
- Port 5173 band emasligini tekshiring
