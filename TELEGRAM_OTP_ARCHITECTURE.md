# Telegram OTP System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Telegram OTP System                          │
│                     @MyBronRobot Integration                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │   Telegram   │
│   (React)    │◄───────►│  (Supabase)  │◄───────►│     Bot      │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         ▼
  User enters            Edge Function            @MyBronRobot
  phone & code           generates OTP            sends OTP
```

## Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Registration Start                                     │
└─────────────────────────────────────────────────────────────────────┘

User Browser                    Frontend (RegisterPage.tsx)
     │                                   │
     │  Opens /register                  │
     ├──────────────────────────────────►│
     │                                   │
     │  Enters name: "John"              │
     │  Enters phone: +998 90 123 45 67  │
     ├──────────────────────────────────►│
     │                                   │
     │  Clicks "Get Code" button         │
     ├──────────────────────────────────►│
     │                                   │
     │  Opens https://t.me/MyBronRobot   │
     │◄──────────────────────────────────┤
     │                                   │

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Telegram Bot Interaction                                    │
└─────────────────────────────────────────────────────────────────────┘

User (Telegram)          @MyBronRobot          Edge Function
     │                        │                      │
     │  /start                │                      │
     ├───────────────────────►│                      │
     │                        │  Webhook POST        │
     │                        ├─────────────────────►│
     │                        │                      │
     │  "Request Contact"     │◄─────────────────────┤
     │◄───────────────────────┤                      │
     │                        │                      │
     │  Shares contact        │                      │
     │  +998901234567         │                      │
     ├───────────────────────►│                      │
     │                        │  Webhook POST        │
     │                        │  {contact: {...}}    │
     │                        ├─────────────────────►│
     │                        │                      │
     │                        │                      ├──┐
     │                        │                      │  │ Generate OTP
     │                        │                      │  │ 123456
     │                        │                      │◄─┘
     │                        │                      │
     │                        │                      │
     │                        │                      ▼
     │                        │              ┌──────────────┐
     │                        │              │   Database   │
     │                        │              │ otp_verif... │
     │                        │              └──────────────┘
     │                        │                      │
     │                        │                      │ INSERT
     │                        │                      │ phone: 998901234567
     │                        │                      │ code: 123456
     │                        │                      │ expires: +5min
     │                        │                      │
     │  "Your code: 123456"   │◄─────────────────────┤
     │◄───────────────────────┤                      │
     │                        │                      │

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: OTP Verification                                            │
└─────────────────────────────────────────────────────────────────────┘

User Browser          Frontend              smsService          Database
     │                    │                      │                  │
     │  Enters code       │                      │                  │
     │  1 2 3 4 5 6       │                      │                  │
     ├───────────────────►│                      │                  │
     │                    │                      │                  │
     │  Clicks "Verify"   │                      │                  │
     ├───────────────────►│                      │                  │
     │                    │  verifyOTP()         │                  │
     │                    ├─────────────────────►│                  │
     │                    │  phone: 998901234567 │                  │
     │                    │  code: 123456        │                  │
     │                    │                      │  RPC verify_otp  │
     │                    │                      ├─────────────────►│
     │                    │                      │                  │
     │                    │                      │  Check:          │
     │                    │                      │  - Code matches  │
     │                    │                      │  - Not expired   │
     │                    │                      │  - Not verified  │
     │                    │                      │                  │
     │                    │                      │  UPDATE          │
     │                    │                      │  verified = true │
     │                    │                      │                  │
     │                    │                      │  {success: true} │
     │                    │                      │◄─────────────────┤
     │                    │  {success: true}     │                  │
     │                    │◄─────────────────────┤                  │
     │                    │                      │                  │
     │  Account created!  │                      │                  │
     │◄───────────────────┤                      │                  │
     │                    │                      │                  │
     │  Redirect to /     │                      │                  │
     │◄───────────────────┤                      │                  │
     │                    │                      │                  │
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ RegisterPage.tsx                                            │    │
│  │                                                             │    │
│  │  • Phone input with formatting (+998 XX XXX XX XX)         │    │
│  │  • "Get Code" button → Opens t.me/MyBronRobot              │    │
│  │  • 6-digit OTP input (42.uz style)                         │    │
│  │  • Auto-focus, paste support                               │    │
│  │  • Verify button → Calls smsService.verifyOTP()            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ smsService.ts                                               │    │
│  │                                                             │    │
│  │  • verifyOTP(phone, code)                                  │    │
│  │  • Calls Supabase RPC: verify_otp                          │    │
│  │  • Returns {success, message, name}                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Edge Function: telegram-bot                                 │    │
│  │ File: supabase/functions/telegram-bot/index.ts             │    │
│  │                                                             │    │
│  │  Framework: Hono                                            │    │
│  │                                                             │    │
│  │  Routes:                                                    │    │
│  │  • GET  / → Health check                                   │    │
│  │  • POST / → Telegram webhook handler                       │    │
│  │                                                             │    │
│  │  Handlers:                                                  │    │
│  │  • /start → Send contact request button                    │    │
│  │  • contact → Generate OTP, save to DB, send to user        │    │
│  │  • text (phone) → Same as contact                          │    │
│  │                                                             │    │
│  │  Functions:                                                 │    │
│  │  • sendTelegramMessage(chatId, text, keyboard)             │    │
│  │  • generateOTP() → 6-digit random code                     │    │
│  │  • formatPhone(phone) → 998XXXXXXXXX                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Database: PostgreSQL                                        │    │
│  │                                                             │    │
│  │  Table: otp_verifications                                   │    │
│  │  ├─ id (UUID)                                               │    │
│  │  ├─ phone (TEXT) - 998XXXXXXXXX                            │    │
│  │  ├─ code (TEXT) - 6 digits                                 │    │
│  │  ├─ name (TEXT) - User name                                │    │
│  │  ├─ verified (BOOLEAN) - false by default                  │    │
│  │  ├─ expires_at (TIMESTAMPTZ) - created_at + 5 min          │    │
│  │  ├─ created_at (TIMESTAMPTZ)                               │    │
│  │  └─ verified_at (TIMESTAMPTZ)                              │    │
│  │                                                             │    │
│  │  RPC Functions:                                             │    │
│  │  • create_otp_verification(phone, code, name)              │    │
│  │    → Invalidates old codes, creates new one                │    │
│  │  • verify_otp(phone, code)                                 │    │
│  │    → Checks validity, marks as verified                    │    │
│  │  • cleanup_expired_otps()                                  │    │
│  │    → Deletes expired codes                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        TELEGRAM LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ @MyBronRobot                                                │    │
│  │                                                             │    │
│  │  Webhook: https://PROJECT.supabase.co/functions/v1/...     │    │
│  │                                                             │    │
│  │  Commands:                                                  │    │
│  │  • /start → Request contact button                         │    │
│  │                                                             │    │
│  │  Accepts:                                                   │    │
│  │  • Contact sharing (button)                                │    │
│  │  • Phone number as text                                    │    │
│  │                                                             │    │
│  │  Sends:                                                     │    │
│  │  • 6-digit OTP code                                        │    │
│  │  • Formatted with <code> tag                               │    │
│  │  • Expiry notice (5 minutes)                               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ OTP Generation Flow                                               │
└──────────────────────────────────────────────────────────────────┘

1. User shares contact in Telegram
   ↓
2. Telegram sends webhook to Edge Function
   {
     "message": {
       "contact": {
         "phone_number": "+998901234567",
         "first_name": "John"
       }
     }
   }
   ↓
3. Edge Function processes:
   • Formats phone: 998901234567
   • Generates OTP: 123456
   • Calls RPC: create_otp_verification()
   ↓
4. Database stores:
   {
     "phone": "998901234567",
     "code": "123456",
     "name": "John",
     "expires_at": "2026-03-05 12:35:00",
     "verified": false
   }
   ↓
5. Edge Function sends to Telegram:
   "✅ Tasdiqlash kodi: 123456"
   ↓
6. User receives OTP in Telegram

┌──────────────────────────────────────────────────────────────────┐
│ OTP Verification Flow                                             │
└──────────────────────────────────────────────────────────────────┘

1. User enters code on website: 123456
   ↓
2. Frontend calls: verifyOTP("998901234567", "123456")
   ↓
3. smsService calls Supabase RPC: verify_otp()
   ↓
4. Database checks:
   • Code matches? ✓
   • Not expired? ✓ (< 5 minutes)
   • Not verified? ✓
   ↓
5. Database updates:
   {
     "verified": true,
     "verified_at": "2026-03-05 12:33:00"
   }
   ↓
6. Returns: {success: true, name: "John"}
   ↓
7. Frontend creates account
   ↓
8. Redirects to dashboard
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Security Layers                                                   │
└──────────────────────────────────────────────────────────────────┘

Layer 1: Environment Variables
├─ TELEGRAM_BOT_TOKEN (Supabase Secret)
├─ SUPABASE_URL (Environment)
└─ SUPABASE_SERVICE_ROLE_KEY (Environment)

Layer 2: Row Level Security (RLS)
├─ INSERT: Anyone can create OTP (for registration)
├─ SELECT: Service role or authenticated users only
└─ UPDATE: Service role only

Layer 3: Data Validation
├─ Phone: Must start with 998, exactly 12 digits
├─ Code: Must be 6 digits
└─ Expiry: Automatically set to +5 minutes

Layer 4: One-Time Use
├─ Old unverified codes invalidated on new request
├─ Verified codes cannot be reused
└─ Expired codes rejected

Layer 5: Rate Limiting (Recommended)
└─ Implement in Edge Function or API Gateway
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Production Deployment                                             │
└──────────────────────────────────────────────────────────────────┘

Development                Production
     │                          │
     │  1. Deploy Function      │
     ├─────────────────────────►│
     │  ./deploy-telegram-bot.sh│
     │                          │
     │  2. Set Secrets          │
     ├─────────────────────────►│
     │  supabase secrets set... │
     │                          │
     │  3. Setup Webhook        │
     ├─────────────────────────►│
     │  ./setup-telegram-webhook│
     │                          │
     │  4. Test Flow            │
     ├─────────────────────────►│
     │  /register → Telegram    │
     │                          │
     │  5. Monitor              │
     ├─────────────────────────►│
     │  supabase functions logs │
     │                          │

┌──────────────────────────────────────────────────────────────────┐
│ Monitoring & Maintenance                                          │
└──────────────────────────────────────────────────────────────────┘

Logs                    Metrics                 Cleanup
  │                        │                       │
  │ Function logs          │ Success rate          │ Expired OTPs
  │ Database queries       │ Response time         │ Old records
  │ Error tracking         │ User registrations    │ Cron job
  │                        │                       │
  ▼                        ▼                       ▼
Supabase Dashboard    Analytics DB          cleanup_expired_otps()
```

## Technology Stack

```
Frontend:
├─ React (Next.js)
├─ TypeScript
├─ Tailwind CSS
└─ Supabase Client

Backend:
├─ Supabase Edge Functions (Deno)
├─ Hono Framework
├─ PostgreSQL
└─ Supabase RPC

External:
├─ Telegram Bot API
└─ @MyBronRobot

Infrastructure:
├─ Supabase Cloud
├─ Edge Network (Global)
└─ PostgreSQL (Managed)
```

## Performance Characteristics

```
┌──────────────────────────────────────────────────────────────────┐
│ Performance Metrics                                               │
└──────────────────────────────────────────────────────────────────┘

OTP Generation:
├─ Telegram webhook → Edge Function: ~100-300ms
├─ Database insert: ~50-100ms
├─ Telegram API send: ~200-500ms
└─ Total: ~350-900ms

OTP Verification:
├─ Frontend → Supabase RPC: ~100-200ms
├─ Database query + update: ~50-100ms
└─ Total: ~150-300ms

Scalability:
├─ Edge Functions: Auto-scaling
├─ Database: Connection pooling
├─ Telegram API: Rate limited (30 msg/sec)
└─ Concurrent users: Unlimited (with proper rate limiting)

Reliability:
├─ Edge Function uptime: 99.9%
├─ Database uptime: 99.95%
├─ Telegram API uptime: 99.9%
└─ Overall: 99.75%
```

---

**Architecture Version**: 1.0  
**Last Updated**: March 5, 2026  
**Status**: Production Ready
