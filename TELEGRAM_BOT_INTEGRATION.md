# Telegram Bot Integration - @MyBronRobot

## Umumiy ma'lumot

SMS o'rniga Telegram bot orqali OTP yuborish tizimi. Foydalanuvchilar @MyBronRobot ga kontakt yuborib, 6 raqamli tasdiqlash kodini olishadi.

## Arxitektura

```
1. Foydalanuvchi RegisterPage da ism va telefon raqamni kiritadi
   ↓
2. "Telegram orqali kod olish" tugmasini bosadi
   ↓
3. Telegram bot (https://t.me/MyBronRobot) ochiladi
   ↓
4. Foydalanuvchi kontaktini yoki telefon raqamni yuboradi
   ↓
5. Bot 6 raqamli OTP generatsiya qiladi
   ↓
6. OTP bazaga saqlanadi (otp_verifications, 5 daqiqa)
   ↓
7. Bot foydalanuvchiga OTP ni yuboradi
   ↓
8. Foydalanuvchi saytda 6 ta inputga kodni kiritadi (42.uz stili)
   ↓
9. Kod tekshiriladi va admin yaratiladi
```

## Telegram Bot Setup

### 1. Bot yaratish

1. Telegram da @BotFather ga o'ting
2. `/newbot` komandasi
3. Bot nomini kiriting: `MyBron Robot`
4. Username kiriting: `MyBronRobot`
5. Bot token ni oling (masalan: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Bot sozlamalari

```
/setdescription - Bot tavsifi
/setabouttext - Bot haqida
/setuserpic - Bot rasmi
/setcommands - Komandalar ro'yxati
```

Komandalar:
```
start - Botni ishga tushirish
```

### 3. Webhook sozlash

```bash
# Edge Function URL
WEBHOOK_URL="https://your-project.supabase.co/functions/v1/telegram-bot"

# Webhook o'rnatish
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}"

# Webhook tekshirish
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Edge Function Deploy

### 1. Environment Variables

```bash
# Telegram Bot Token
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here

# Supabase credentials (avtomatik o'rnatiladi)
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
```

### 2. Deploy

```bash
# Function ni deploy qilish
supabase functions deploy telegram-bot

# Logs ko'rish
supabase functions logs telegram-bot --tail
```

## Frontend Changes

### RegisterPage.tsx

**O'zgarishlar:**
1. ✅ SMS yuborish o'chirildi
2. ✅ "Telegram orqali kod olish" tugmasi qo'shildi
3. ✅ 42.uz stilidagi 6 ta input (har biri 1 raqam)
4. ✅ Avtomatik keyingi inputga o'tish
5. ✅ Paste qo'llab-quvvatlash
6. ✅ Backspace bilan orqaga qaytish

**Kod misoli:**
```tsx
// 6 ta input
{otp.map((digit, index) => (
  <input
    key={index}
    id={`otp-${index}`}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={digit}
    onChange={(e) => handleOtpChange(index, e.target.value)}
    onKeyDown={(e) => handleOtpKeyDown(index, e)}
    onPaste={index === 0 ? handleOtpPaste : undefined}
    className="w-12 h-14 bg-zinc-900 border-2 border-zinc-700 rounded-lg..."
  />
))}
```

### smsService.ts

**O'zgarishlar:**
1. ✅ `sendOTP()` funksiyasi o'chirildi
2. ✅ `verifyOTP()` funksiyasi qoldirildi (faqat tekshirish)
3. ✅ `generateOTP()`, `formatPhone()`, `displayPhone()` qoldirildi

## Database

### otp_verifications jadvali

Jadval o'zgarmadi, faqat OTP yaratish usuli o'zgardi (SMS o'rniga Telegram).

```sql
-- OTP yaratish (Telegram bot chaqiradi)
SELECT create_otp_verification('998901234567', '123456', 'John Doe');

-- OTP tekshirish (Frontend chaqiradi)
SELECT * FROM verify_otp('998901234567', '123456');
```

## Bot Workflow

### 1. /start komandasi

```
Salom John! 👋

Ro'yxatdan o'tish uchun telefon raqamingizni yuboring.

Pastdagi tugmani bosing yoki telefon raqamingizni yozing.

[📱 Kontaktni yuborish]
```

### 2. Kontakt yuborilganda

```
✅ Tasdiqlash kodi:

123456

Bu kodni saytda kiriting.
⏱ Kod 5 daqiqa amal qiladi.
```

### 3. Noto'g'ri format

```
❌ Noto'g'ri format. Iltimos +998 XX XXX XX XX formatida yuboring.
```

## Test qilish

### 1. Local Test

```bash
# Supabase local
supabase start

# Edge Function serve
supabase functions serve telegram-bot

# Ngrok orqali webhook
ngrok http 54321

# Webhook o'rnatish
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-ngrok-url.ngrok.io/functions/v1/telegram-bot"
```

### 2. Production Test

1. `/register` sahifasiga o'ting
2. Ism va telefon raqamni kiriting
3. "Telegram orqali kod olish" tugmasini bosing
4. Telegram bot ochiladi
5. /start bosing
6. Kontaktni yuboring yoki telefon raqamni yozing
7. Bot sizga 6 raqamli kod yuboradi
8. Saytda kodni kiriting
9. Admin yaratiladi va dashboard ga yo'naltirilasiz

## Xavfsizlik

### 1. Bot Token
- Environment variable da saqlang
- Hech qachon kodga qo'ymang
- Agar leak bo'lsa, @BotFather da yangilang

### 2. Webhook
- Faqat HTTPS
- Supabase Edge Function avtomatik HTTPS

### 3. Rate Limiting
- Telegram API: 30 xabar/soniya
- Bizning bot: 1 OTP/foydalanuvchi/daqiqa (frontend da)

### 4. OTP Muddati
- 5 daqiqa amal qiladi
- Muddati o'tgan kodlar avtomatik bekor qilinadi

## Monitoring

### Bot Statistics

```bash
# Webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Updates count
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

### Edge Function Logs

```bash
# Real-time logs
supabase functions logs telegram-bot --tail

# Last 100 logs
supabase functions logs telegram-bot --limit 100
```

### Database Queries

```sql
-- Bugungi OTP lar
SELECT * FROM otp_verifications 
WHERE created_at > CURRENT_DATE
ORDER BY created_at DESC;

-- Tasdiqlangan OTP lar
SELECT * FROM otp_verifications 
WHERE verified = true
ORDER BY verified_at DESC
LIMIT 10;

-- Muddati o'tgan OTP lar
SELECT COUNT(*) FROM otp_verifications 
WHERE expires_at < NOW() AND verified = false;
```

## Troubleshooting

### 1. Bot javob bermayapti
- Webhook to'g'ri o'rnatilganligini tekshiring
- Edge Function deploy qilinganligini tekshiring
- Bot token to'g'riligini tekshiring
- Logs ni ko'ring

### 2. OTP kelmayapti
- Database ga OTP saqlanayotganligini tekshiring
- Telefon raqam formati to'g'riligini tekshiring
- Bot xabar yuborish huquqiga ega ekanligini tekshiring

### 3. Kod noto'g'ri deyapti
- OTP muddati o'tmaganligini tekshiring
- Telefon raqam to'g'ri formatda ekanligini tekshiring
- Database da OTP mavjudligini tekshiring

## Kelajakda qo'shish mumkin

1. **Inline Keyboard**: Kod yuborilgandan keyin "Qayta yuborish" tugmasi
2. **Multi-language**: O'zbek, Rus, Ingliz tillari
3. **Admin Panel**: Bot orqali admin panel
4. **Notifications**: Yangi bron haqida xabar
5. **Statistics**: Bot foydalanish statistikasi
6. **Deep Links**: Saytdan to'g'ridan-to'g'ri botga o'tish

## Fayllar

1. ✅ `supabase/functions/telegram-bot/index.ts` - Bot Edge Function
2. ✅ `src/app/components/RegisterPage.tsx` - Yangilangan register sahifasi
3. ✅ `src/lib/smsService.ts` - Yangilangan service (SMS o'chirildi)
4. ✅ `TELEGRAM_BOT_INTEGRATION.md` - Bu dokumentatsiya
5. ❌ `supabase/functions/send-sms-otp/` - O'chirildi
6. ❌ `SMS_OTP_FUNCTION.md` - O'chirildi
7. ❌ `SMS_OTP_USAGE_EXAMPLE.tsx` - O'chirildi

## Support

Telegram: @MyBronRobot
Bot Username: @MyBronRobot
Bot Link: https://t.me/MyBronRobot
