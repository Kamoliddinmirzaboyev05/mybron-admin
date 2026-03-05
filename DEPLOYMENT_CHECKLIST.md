# 🚀 Telegram OTP Deployment Checklist

Use this checklist to ensure successful deployment of the Telegram OTP system.

## Pre-Deployment

### ✅ Code Review
- [ ] All legacy SMS code removed (`send-sms-otp` directory deleted)
- [ ] No hardcoded tokens in any files
- [ ] Edge function uses Hono framework
- [ ] Frontend opens Telegram bot correctly
- [ ] OTP verification uses database only

### ✅ Database Setup
- [ ] `otp_verifications` table exists
- [ ] RPC function `create_otp_verification` exists
- [ ] RPC function `verify_otp` exists
- [ ] RPC function `cleanup_expired_otps` exists
- [ ] Row Level Security (RLS) is enabled
- [ ] Indexes are created

**Verify with:**
```sql
-- Check table
SELECT * FROM otp_verifications LIMIT 1;

-- Check functions
SELECT proname FROM pg_proc 
WHERE proname IN ('create_otp_verification', 'verify_otp', 'cleanup_expired_otps');

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'otp_verifications';
```

### ✅ Environment Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged into Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Telegram Bot Token available
- [ ] Bot username is @MyBronRobot

## Deployment Steps

### Step 1: Deploy Edge Function
- [ ] Run deployment script
  ```bash
  ./deploy-telegram-bot.sh
  ```
- [ ] Verify deployment success
  ```bash
  supabase functions list
  ```
- [ ] Note the function URL
  ```
  https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot
  ```

### Step 2: Configure Secrets
- [ ] Set Telegram Bot Token
  ```bash
  supabase secrets set TELEGRAM_BOT_TOKEN=8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE
  ```
- [ ] Verify secrets are set
  ```bash
  supabase secrets list
  ```
- [ ] Should see: `TELEGRAM_BOT_TOKEN`

### Step 3: Setup Webhook
- [ ] Run webhook setup script
  ```bash
  ./setup-telegram-webhook.sh
  ```
- [ ] Verify webhook is active
  ```bash
  curl "https://api.telegram.org/bot8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE/getWebhookInfo"
  ```
- [ ] Check response shows:
  - `"url": "https://...supabase.co/functions/v1/telegram-bot"`
  - `"has_custom_certificate": false`
  - `"pending_update_count": 0`

## Testing

### Test 1: Health Check
- [ ] Test function is responding
  ```bash
  curl https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot
  ```
- [ ] Should return: `{"status":"ok","bot":"@MyBronRobot"}`

### Test 2: Telegram Bot
- [ ] Open Telegram
- [ ] Search for @MyBronRobot
- [ ] Send `/start`
- [ ] Should receive welcome message with "Request Contact" button
- [ ] Click button or type phone number
- [ ] Should receive 6-digit OTP code

### Test 3: Database Integration
- [ ] After receiving OTP in Telegram, check database
  ```sql
  SELECT phone, code, verified, expires_at, created_at 
  FROM otp_verifications 
  ORDER BY created_at DESC 
  LIMIT 1;
  ```
- [ ] Should see new record with:
  - Phone number (998XXXXXXXXX)
  - 6-digit code
  - `verified = false`
  - `expires_at` is ~5 minutes in future

### Test 4: Frontend Registration
- [ ] Open registration page: `http://localhost:3000/register`
- [ ] Enter name: "Test User"
- [ ] Enter phone: "+998 90 123 45 67"
- [ ] Click "Telegram orqali kod olish"
- [ ] Should open @MyBronRobot in new tab
- [ ] Complete Telegram flow (get OTP)
- [ ] Return to registration page
- [ ] Enter 6-digit OTP code
- [ ] Click "Tasdiqlash"
- [ ] Should see success message
- [ ] Should redirect to dashboard

### Test 5: OTP Verification
- [ ] After entering code, check database
  ```sql
  SELECT phone, code, verified, verified_at 
  FROM otp_verifications 
  WHERE phone = '998901234567' 
  ORDER BY created_at DESC 
  LIMIT 1;
  ```
- [ ] Should see:
  - `verified = true`
  - `verified_at` is set

### Test 6: Expiry Check
- [ ] Wait 6 minutes after receiving OTP
- [ ] Try to verify expired code
- [ ] Should see error: "Noto'g'ri yoki muddati o'tgan kod"

### Test 7: Invalid Phone
- [ ] In Telegram, send phone from different country (e.g., +1234567890)
- [ ] Should receive error: "Faqat O'zbekiston raqamlari qabul qilinadi (+998)"

## Monitoring Setup

### Function Logs
- [ ] Start tailing logs
  ```bash
  supabase functions logs telegram-bot --tail
  ```
- [ ] Perform test registration
- [ ] Should see log entries for:
  - Webhook received
  - OTP generated
  - Database insert
  - Message sent

### Database Monitoring
- [ ] Create monitoring query
  ```sql
  -- Today's statistics
  SELECT 
    COUNT(*) as total_otps,
    SUM(CASE WHEN verified THEN 1 ELSE 0 END) as verified,
    SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired,
    ROUND(100.0 * SUM(CASE WHEN verified THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
  FROM otp_verifications 
  WHERE created_at::date = CURRENT_DATE;
  ```

### Error Tracking
- [ ] Check for errors in function logs
  ```bash
  supabase functions logs telegram-bot | grep -i error
  ```
- [ ] Should see no errors during normal operation

## Post-Deployment

### Cleanup
- [ ] Remove test OTP records
  ```sql
  DELETE FROM otp_verifications 
  WHERE phone LIKE '99890%' 
  AND created_at < NOW() - INTERVAL '1 hour';
  ```

### Documentation
- [ ] Share deployment guide with team
- [ ] Document function URL
- [ ] Document bot username (@MyBronRobot)
- [ ] Add to runbook

### Optional: Cron Job
- [ ] Set up automated cleanup (optional)
  ```sql
  SELECT cron.schedule(
    'cleanup-expired-otps',
    '0 * * * *',  -- Every hour
    'SELECT cleanup_expired_otps();'
  );
  ```

## Troubleshooting

### Issue: Bot not responding
- [ ] Check webhook status
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
  ```
- [ ] Check function logs
  ```bash
  supabase functions logs telegram-bot --tail
  ```
- [ ] Verify TELEGRAM_BOT_TOKEN secret is set
  ```bash
  supabase secrets list
  ```

### Issue: OTP not saving
- [ ] Check function logs for database errors
- [ ] Verify RPC function exists
  ```sql
  SELECT proname FROM pg_proc WHERE proname = 'create_otp_verification';
  ```
- [ ] Test RPC manually
  ```sql
  SELECT create_otp_verification('998901234567', '123456', 'Test');
  ```

### Issue: Verification fails
- [ ] Check code hasn't expired
  ```sql
  SELECT * FROM otp_verifications 
  WHERE phone = '998901234567' 
  AND expires_at > NOW() 
  AND verified = false;
  ```
- [ ] Check phone format matches
- [ ] Verify RPC function works
  ```sql
  SELECT * FROM verify_otp('998901234567', '123456');
  ```

### Issue: Webhook not receiving updates
- [ ] Delete and reset webhook
  ```bash
  curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
  ./setup-telegram-webhook.sh
  ```
- [ ] Check function is accessible
  ```bash
  curl https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot
  ```

## Security Verification

- [ ] No tokens in git history
  ```bash
  git log -p | grep -i "bot.*token"
  ```
- [ ] No tokens in code files
  ```bash
  grep -r "8562977717" src/
  ```
- [ ] RLS enabled on database
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE tablename = 'otp_verifications';
  ```
- [ ] Secrets stored in Supabase
  ```bash
  supabase secrets list
  ```

## Performance Verification

- [ ] Test response time
  ```bash
  time curl https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot
  ```
- [ ] Should be < 500ms

- [ ] Test OTP generation time
  - Send contact in Telegram
  - Measure time until OTP received
  - Should be < 2 seconds

- [ ] Test verification time
  - Enter OTP on website
  - Measure time until success
  - Should be < 1 second

## Final Checks

- [ ] All tests passing
- [ ] No errors in logs
- [ ] Documentation complete
- [ ] Team notified
- [ ] Monitoring in place
- [ ] Backup plan documented

## Sign-Off

**Deployed by**: _______________  
**Date**: _______________  
**Environment**: Production / Staging  
**Function URL**: _______________  
**Bot Username**: @MyBronRobot  
**Status**: ✅ Ready / ⚠️ Issues / ❌ Failed  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

## Quick Reference

**Deploy**: `./deploy-telegram-bot.sh`  
**Webhook**: `./setup-telegram-webhook.sh`  
**Logs**: `supabase functions logs telegram-bot --tail`  
**Test**: Open @MyBronRobot in Telegram  
**Monitor**: Check `otp_verifications` table  

---

**Checklist Version**: 1.0  
**Last Updated**: March 5, 2026
