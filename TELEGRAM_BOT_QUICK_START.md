# Telegram Bot Quick Start Guide

## 🚀 Tez deploy qilish

### 1-qadam: Scriptlarga ruxsat berish

```bash
chmod +x deploy-telegram-bot.sh
chmod +x setup-telegram-webhook.sh
chmod +x test-telegram-bot.sh
```

### 2-qadam: Deploy qilish

```bash
./deploy-telegram-bot.sh
```

Bu script avtomatik:
- ✅ Supabase secrets o'rnatadi
- ✅ Edge Function deploy qiladi
- ✅ Telegram webhook o'rnatadi
- ✅ Webhook tekshiradi

### 3-qadam: Test qilish

```bash
./test-telegram-bot.sh
```

Yoki qo'lda:

1. Telegram da @MyBronRobot ga o'ting
2. `/start` bosing
3. Kontaktingizni yuboring
4. 6 raqamli kod olasiz

### 4-qadam: Logs ko'rish

```bash
supabase functions logs telegram-bot --tail
```

## 📱 Bot ma'lumotlari

- **Bot Username**: @MyBronRobot
- **Bot Link**: https://t.me/MyBronRobot
- **Bot Token**: `8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE`

## 🔧 Supabase ma'lumotlari

- **URL**: https://qhglhdmsbhkadsczguji.supabase.co
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Webhook URL**: https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot

## 🧪 Test Scenario

### Frontend Test

1. Brauzerda `/register` sahifasiga o'ting
2. Ismingizni kiriting: `Test User`
3. Telefon raqamingizni kiriting: `+998 90 123 45 67`
4. "Telegram orqali kod olish" tugmasini bosing
5. Telegram bot ochiladi

### Bot Test

1. Telegram da @MyBronRobot ga o'ting
2. `/start` bosing
3. "📱 Kontaktni yuborish" tugmasini bosing
4. Yoki telefon raqamingizni yozing: `+998901234567`
5. Bot sizga 6 raqamli kod yuboradi: `123456`

### Verification Test

1. Saytga qaytib, 6 ta inputga kodni kiriting
2. Har bir inputga 1 ta raqam
3. Avtomatik keyingi inputga o'tadi
4. "Tasdiqlash" tugmasini bosing
5. Admin yaratiladi va dashboard ga yo'naltirilasiz

## 🐛 Troubleshooting

### Bot javob bermayapti

```bash
# Webhook holatini tekshirish
curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getWebhookInfo"

# Webhook o'chirish va qayta o'rnatish
curl -X POST "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/deleteWebhook"
./setup-telegram-webhook.sh
```

### Edge Function xatolik bermoqda

```bash
# Logs ko'rish
supabase functions logs telegram-bot --tail

# Qayta deploy qilish
supabase functions deploy telegram-bot --no-verify-jwt
```

### OTP bazaga saqlanmayapti

```sql
-- Database da tekshirish
SELECT * FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Function test qilish
SELECT create_otp_verification('998901234567', '123456', 'Test User');
```

## 📊 Monitoring

### Webhook Statistics

```bash
# Webhook info
curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getWebhookInfo" | jq '.'

# Pending updates
curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getWebhookInfo" | jq '.result.pending_update_count'
```

### Database Statistics

```sql
-- Bugungi OTP lar
SELECT COUNT(*) FROM otp_verifications 
WHERE created_at > CURRENT_DATE;

-- Tasdiqlangan OTP lar
SELECT COUNT(*) FROM otp_verifications 
WHERE verified = true;

-- Muddati o'tgan OTP lar
SELECT COUNT(*) FROM otp_verifications 
WHERE expires_at < NOW() AND verified = false;
```

### Edge Function Statistics

```bash
# Function invocations
supabase functions logs telegram-bot --limit 100

# Error rate
supabase functions logs telegram-bot | grep "error"
```

## 🔐 Security Checklist

- ✅ Bot token environment variable da
- ✅ Service role key environment variable da
- ✅ Webhook HTTPS orqali
- ✅ OTP 5 daqiqa amal qiladi
- ✅ RLS policies yoqilgan
- ✅ Rate limiting frontend da

## 📝 Next Steps

1. ✅ Bot deploy qilindi
2. ✅ Webhook o'rnatildi
3. ✅ Frontend yangilandi
4. ⏳ Production test qilish
5. ⏳ Monitoring sozlash
6. ⏳ Error handling yaxshilash

## 🆘 Support

Agar muammo bo'lsa:

1. Logs ni tekshiring: `supabase functions logs telegram-bot --tail`
2. Webhook ni tekshiring: `./test-telegram-bot.sh`
3. Database ni tekshiring: `SELECT * FROM otp_verifications ORDER BY created_at DESC LIMIT 10;`
4. Bot holatini tekshiring: `curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getMe"`

## 📚 Documentation

- [TELEGRAM_BOT_INTEGRATION.md](./TELEGRAM_BOT_INTEGRATION.md) - To'liq dokumentatsiya
- [CREATE_OTP_VERIFICATIONS_TABLE.sql](./CREATE_OTP_VERIFICATIONS_TABLE.sql) - Database schema
- [Telegram Bot API](https://core.telegram.org/bots/api) - Official docs
