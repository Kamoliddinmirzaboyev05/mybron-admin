#!/bin/bash

# Telegram Bot Test Script
# Bu script bot ishlayotganligini tekshiradi

TELEGRAM_BOT_TOKEN="8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE"

echo "🧪 Testing Telegram Bot"
echo "================================"
echo ""

# 1. Bot info
echo "1️⃣ Bot Info:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.'
echo ""

# 2. Webhook info
echo "2️⃣ Webhook Info:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'
echo ""

# 3. Recent updates
echo "3️⃣ Recent Updates:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=5" | jq '.result | length'
echo " updates found"
echo ""

echo "✅ Test complete!"
echo ""
echo "Agar webhook pending_update_count > 0 bo'lsa:"
echo "curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook\""
echo "curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook\" -d 'url=https://qhglhdmsbhkadsczguji.supabase.co/functions/v1/telegram-bot'"
echo ""
