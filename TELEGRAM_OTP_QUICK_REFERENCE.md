# Telegram OTP - Quick Reference

## 🚀 Quick Deploy (3 Steps)

### 1. Deploy Function
```bash
./deploy-telegram-bot.sh
```

### 2. Set Secret
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE
```

### 3. Setup Webhook
```bash
./setup-telegram-webhook.sh
```

## ✅ Verification Checklist

- [ ] Database table created (`otp_verifications`)
- [ ] Edge function deployed (`telegram-bot`)
- [ ] Bot token added to secrets
- [ ] Webhook configured and active
- [ ] Test registration flow works

## 🧪 Test Commands

### Test Bot
```bash
# Open Telegram and message @MyBronRobot
# Send: /start
# Share contact or type: +998901234567
```

### Check Webhook Status
```bash
curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getWebhookInfo"
```

### Check Function Logs
```bash
supabase functions logs telegram-bot --tail
```

### Check Database
```sql
SELECT phone, code, verified, expires_at, created_at 
FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🔄 User Flow

1. User opens `/register`
2. Enters name and phone: `+998 90 123 45 67`
3. Clicks "Telegram orqali kod olish"
4. Redirected to @MyBronRobot
5. Bot sends 6-digit code
6. User enters code on website
7. Account created ✅

## 📱 Bot Commands

- `/start` - Start conversation and request contact

## 🔧 Common Issues

### Bot not responding?
```bash
# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Check logs
supabase functions logs telegram-bot
```

### OTP not saving?
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'create_otp_verification';

-- Test manually
SELECT create_otp_verification('998901234567', '123456', 'Test User');
```

### Code expired?
```sql
-- Codes expire after 5 minutes
SELECT * FROM otp_verifications 
WHERE phone = '998901234567' 
AND expires_at > NOW() 
AND verified = false;
```

## 🗑️ Cleanup

### Remove expired codes
```sql
SELECT cleanup_expired_otps();
```

### Delete all test codes
```sql
DELETE FROM otp_verifications WHERE phone LIKE '99890%';
```

## 📊 Monitoring Queries

### Today's registrations
```sql
SELECT COUNT(*) as registrations_today
FROM otp_verifications 
WHERE verified = true 
AND created_at::date = CURRENT_DATE;
```

### Success rate
```sql
SELECT 
  COUNT(*) as total_attempts,
  SUM(CASE WHEN verified THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN verified THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM otp_verifications 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Average verification time
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (verified_at - created_at))) as avg_seconds
FROM otp_verifications 
WHERE verified = true 
AND created_at > NOW() - INTERVAL '24 hours';
```

## 🔐 Security Notes

- ✅ No hardcoded tokens in frontend
- ✅ Bot token stored in Supabase Secrets
- ✅ RLS enabled on database table
- ✅ OTP expires after 5 minutes
- ✅ Only Uzbekistan numbers accepted (+998)
- ✅ One-time use codes (marked as verified)

## 📞 Support

**Bot**: @MyBronRobot  
**Function URL**: `https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot`  
**Database**: `otp_verifications` table

## 🎯 Key Files

```
supabase/functions/telegram-bot/
├── index.ts              # Main webhook handler (Hono)
└── deno.json            # Deno configuration

src/
├── lib/smsService.ts    # OTP verification service
└── app/components/
    └── RegisterPage.tsx # Registration UI

CREATE_OTP_VERIFICATIONS_TABLE.sql  # Database schema
deploy-telegram-bot.sh              # Deployment script
setup-telegram-webhook.sh           # Webhook setup
```

## 🎨 UI Features

- 42.uz style 6-digit input
- Auto-focus next input
- Paste support (full code)
- Real-time validation
- Loading states
- Error messages in Uzbek

## 🌐 Environment Variables

```bash
# Supabase Secrets (server-side)
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 Notes

- OTP codes are 6 digits
- Codes expire after 5 minutes
- Phone format: 998XXXXXXXXX (12 digits)
- Bot only accepts Uzbekistan numbers
- Old unverified codes are invalidated when new code is requested
