// OTP Service - Telegram Bot Integration
// SMS o'rniga Telegram bot orqali OTP yuborish

import { supabase } from './supabase';

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  name?: string;
}

/**
 * OTP kodni tekshirish (Telegram bot orqali yuborilgan)
 * @param phone - Telefon raqami (998901234567 formatida, faqat raqamlar)
 * @param code - Tasdiqlash kodi (6 raqamli)
 * @returns Promise<VerifyOTPResponse>
 */
export async function verifyOTP(phone: string, code: string): Promise<VerifyOTPResponse> {
  try {
    // Telefon raqamni tozalash - faqat raqamlar ('+', ' ', '-' ni olib tashlash)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Telefon raqam validatsiyasi
    if (!cleanPhone || cleanPhone.length < 12) {
      return {
        success: false,
        error: 'Telefon raqam noto\'g\'ri formatda (12 raqam kerak)',
      };
    }

    // Kod validatsiyasi
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: 'Tasdiqlash kodi 6 raqamdan iborat bo\'lishi kerak',
      };
    }

    // OTP ni bazadan tekshirish
    // MUHIM: Database funksiyasi verify_otp(p_code text, p_phone text) tartibida parametrlarni kutadi
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_otp', {
      p_code: code,        // Birinchi parametr: kod
      p_phone: cleanPhone, // Ikkinchi parametr: telefon (faqat raqamlar, '+' siz)
    });

    if (verifyError) {
      console.error('OTP verification error:', verifyError);
      return {
        success: false,
        error: 'Tekshirishda xatolik: ' + verifyError.message,
      };
    }

    // Database funksiyasi boolean qaytaradi
    // true = success, false = invalid/expired
    if (verifyData === true) {
      return {
        success: true,
        message: 'Tasdiqlandi',
      };
    } else {
      return {
        success: false,
        error: 'Noto\'g\'ri yoki muddati o\'tgan kod',
      };
    }
  } catch (error: any) {
    console.error('OTP verification exception:', error);
    return {
      success: false,
      error: error.message || 'Kutilmagan xatolik yuz berdi',
    };
  }
}

/**
 * Tasodifiy 6 raqamli OTP kodi generatsiya qilish
 * @returns string - 6 raqamli kod
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Telefon raqamni formatlash
 * @param phone - Har qanday formatdagi telefon raqam
 * @returns string - Tozalangan raqam (faqat raqamlar)
 */
export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Telefon raqamni ko'rsatish uchun formatlash
 * @param phone - Telefon raqam
 * @returns string - +998 XX XXX XX XX formatida
 */
export function displayPhone(phone: string): string {
  const clean = formatPhone(phone);
  
  if (clean.length === 12 && clean.startsWith('998')) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
  }
  
  return phone;
}
