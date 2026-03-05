#!/bin/bash

# Telegram Bot Deployment Script
# Bu script Telegram bot Edge Function ni deploy qiladi

echo "🚀 Deploying Telegram Bot Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI topilmadi. O'rnatish: npm install -g supabase"
    exit 1
fi

# Deploy the function
echo "📦 Deploying telegram-bot function..."
supabase functions deploy telegram-bot

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add TELEGRAM_BOT_TOKEN to Supabase Secrets:"
    echo "   supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here"
    echo ""
    echo "2. Set up webhook using setup-telegram-webhook.sh"
    echo "   ./setup-telegram-webhook.sh"
else
    echo "❌ Deployment failed!"
    exit 1
fi
