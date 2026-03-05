# Telegram OTP Integration - Deployment Guide

## Overview
This guide covers the complete deployment of the Telegram Bot OTP authentication system for MyBron Admin.

## Architecture
- **Frontend**: React (RegisterPage.tsx) - User enters phone and receives code via Telegram
- **Backend**: Supabase Edge Function (telegram-bot) - Handles Telegram webhooks and OTP generation
- **Database**: PostgreSQL (otp_verifications table) - Stores OTP codes
- **Bot**: @MyBronRobot - Sends OTP codes to users

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Telegram Bot Token from @BotFather
3. Supabase project with database access

## Step 1: Database Setup

Run the SQL script to create the OTP table and functions:

```bash
# Execute in Supabase SQL Editor or via CLI
psql -h your-db-host -U postgres -d postgres -f CREATE_OTP_VERIFICATIONS_TABLE.sql
```

This creates:
- `otp_verifications` table
- `create_otp_verification()` function
- `verify_otp()` function
- `cleanup_expired_otps()` function
- Row Level Security policies

## Step 2: Configure Secrets

Add the Telegram Bot Token to Supabase Secrets:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Verify secrets are set:

```bash
supabase secrets list
```

## Step 3: Deploy Edge Function

Deploy the telegram-bot function:

```bash
# Using the deployment script
./deploy-telegram-bot.sh

# Or manually
supabase functions deploy telegram-bot
```

Get your function URL:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-bot
```

## Step 4: Set Telegram Webhook

Configure the webhook to point to your Edge Function:

```bash
# Using the setup script
TELEGRAM_BOT_TOKEN=your_token SUPABASE_URL=your_url ./setup-telegram-webhook.sh

# Or manually
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-bot"}'
```

Verify webhook:
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## Step 5: Frontend Configuration

The frontend is already configured to:
1. Open Telegram bot when "Get Code" is clicked
2. Accept 6-digit OTP input (42.uz style)
3. Verify OTP against database

No additional configuration needed.

## Testing

### Test the complete flow:

1. **Open the registration page**
   ```
   http://localhost:3000/register
   ```

2. **Enter name and phone number**
   - Format: +998 XX XXX XX XX

3. **Click "Telegram orqali kod olish"**
   - Opens @MyBronRobot in Telegram

4. **In Telegram:**
   - Send /start
   - Share contact or type phone number
   - Receive 6-digit OTP code

5. **Back on website:**
   - Enter the 6-digit code
   - Click "Tasdiqlash"
   - Account created successfully

### Test Edge Function directly:

```bash
# Health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-bot

# Simulate Telegram webhook
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-bot \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 1,
      "from": {"id": 123, "first_name": "Test"},
      "chat": {"id": 123, "type": "private"},
      "date": 1234567890,
      "text": "/start"
    }
  }'
```

## Monitoring

### Check function logs:

```bash
supabase functions logs telegram-bot
```

### Check database OTP records:

```sql
SELECT * FROM otp_verifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check expired OTPs:

```sql
SELECT COUNT(*) FROM otp_verifications 
WHERE expires_at < NOW() AND verified = false;
```

## Troubleshooting

### Issue: Bot not responding
- Check webhook is set correctly: `getWebhookInfo`
- Check function logs: `supabase functions logs telegram-bot`
- Verify TELEGRAM_BOT_TOKEN secret is set

### Issue: OTP not saving to database
- Check RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'create_otp_verification'`
- Check table exists: `SELECT * FROM otp_verifications LIMIT 1`
- Check function logs for database errors

### Issue: OTP verification fails
- Check code hasn't expired (5 minutes)
- Check phone number format matches (998XXXXXXXXX)
- Check verify_otp function: `SELECT * FROM verify_otp('998901234567', '123456')`

### Issue: Webhook not receiving updates
- Verify webhook URL is correct
- Check if bot is blocked by user
- Test with /start command first

## Security Checklist

- [x] No hardcoded tokens in code
- [x] TELEGRAM_BOT_TOKEN stored in Supabase Secrets
- [x] Row Level Security enabled on otp_verifications
- [x] OTP codes expire after 5 minutes
- [x] Phone number validation (Uzbekistan only)
- [x] Service role key used for database operations

## Cleanup

### Remove expired OTPs (run periodically):

```sql
SELECT cleanup_expired_otps();
```

### Optional: Set up cron job:

```sql
SELECT cron.schedule(
  'cleanup-expired-otps',
  '0 * * * *',  -- Every hour
  'SELECT cleanup_expired_otps();'
);
```

## Files Modified

1. ✅ `supabase/functions/telegram-bot/index.ts` - Hono-based webhook handler
2. ✅ `supabase/functions/telegram-bot/deno.json` - Hono import configuration
3. ✅ `src/lib/smsService.ts` - OTP verification only (no SMS sending)
4. ✅ `src/app/components/RegisterPage.tsx` - Telegram bot integration
5. ✅ `CREATE_OTP_VERIFICATIONS_TABLE.sql` - Database schema
6. ✅ `deploy-telegram-bot.sh` - Deployment script
7. ✅ `setup-telegram-webhook.sh` - Webhook configuration script

## Files Removed

1. ❌ `supabase/functions/send-sms-otp/` - Legacy SMS function (deleted)

## Next Steps

1. Deploy to production
2. Monitor OTP success rate
3. Set up automated cleanup cron job
4. Add analytics for registration flow
5. Consider adding rate limiting for OTP requests

## Support

For issues or questions:
- Check function logs: `supabase functions logs telegram-bot`
- Check database: `SELECT * FROM otp_verifications ORDER BY created_at DESC LIMIT 10`
- Test bot directly in Telegram: @MyBronRobot
