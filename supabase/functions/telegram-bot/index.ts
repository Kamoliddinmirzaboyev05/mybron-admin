import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const BOT_SERVICE_ROLE_KEY = Deno.env.get('BOT_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, BOT_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    const update = await req.json()
    const message = update.message

    if (message?.text === '/start') {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: `Salom ${message.from.first_name}! 👋\n\nRo'yxatdan o'tish uchun kontaktni yuboring.`,
          reply_markup: {
            keyboard: [[{ text: '📱 Kontaktni yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        })
      })
    }

    if (message?.contact) {
      const phone = message.contact.phone_number.replace(/\D/g, '')
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // RPC orqali bazaga yozish
      const { error } = await supabase.rpc('create_otp_verification', {
        p_phone: phone.startsWith('998') ? phone : '998' + phone,
        p_code: code,
        p_name: message.contact.first_name
      })

      const replyText = error ? "❌ Xatolik yuz berdi." : `✅ Tasdiqlash kodi: <code>${code}</code>`
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: message.chat.id, text: replyText, parse_mode: 'HTML' })
      })
    }

    return new Response('ok')
  } catch (e) {
    console.error("Xato:", e.message)
    return new Response(e.message, { status: 500 })
  }
})