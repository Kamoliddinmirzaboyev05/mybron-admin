#!/bin/bash

# Supabase Secrets Setup Script
# Bu script Supabase Edge Function uchun environment variables o'rnatadi

echo "🔐 Setting up Supabase Secrets"
echo "================================"
echo ""

# Telegram Bot Token
echo "📱 Setting TELEGRAM_BOT_TOKEN..."
supabase secrets set TELEGRAM_BOT_TOKEN="8562977717:AAFcjCD0wLk1DDFHhhWBe3vwzuO72tDXDyE"

echo ""
echo "✅ Secrets set successfully!"
echo ""
echo "Secrets ni ko'rish:"
echo "supabase secrets list"
echo ""
echo "Edge Function deploy qilish:"
echo "supabase functions deploy telegram-bot"
echo ""
