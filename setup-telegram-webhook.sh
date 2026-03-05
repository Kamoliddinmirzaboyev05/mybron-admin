#!/bin/bash

# Telegram Bot Webhook Setup Script
# Bu script Telegram bot uchun webhook o'rnatadi

# Get values from environment or use defaults
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE}"
SUPABASE_URL="${SUPABASE_URL:-https://qhglhdmsbhkadsczguji.supabase.co}"
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/telegram-bot"

echo "🤖 Telegram Bot Webhook Setup"
echo "================================"
echo ""
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Webhook o'rnatish
echo "📡 Setting webhook..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}")

echo "Response: $RESPONSE"
echo ""

# Webhook info olish
echo "ℹ️  Getting webhook info..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'
echo ""

# Bot info
echo "🤖 Bot info..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.'
echo ""

echo "✅ Setup complete!"
echo ""
echo "Test qilish uchun:"
echo "1. Telegram da @MyBronRobot ga o'ting"
echo "2. /start bosing"
echo "3. Kontaktingizni yuboring"
echo ""
