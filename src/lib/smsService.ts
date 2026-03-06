// OTP Service - Telegram Bot Integration
// Simplified: Only OTP code verification

import { supabase } from './supabase';

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  phone?: string;  // Phone number returned from database
}

/**
 * OTP kodni tekshirish (faqat kod bilan)
 * @param code - Tasdiqlash kodi (6 raqamli)
 * @returns Promise<VerifyOTPResponse> - Returns phone number if valid
 */
export async function verifyOTPCode(code: string): Promise<VerifyOTPResponse> {
  try {
    // Kod validatsiyasi
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: 'Tasdiqlash kodi 6 raqamdan iborat bo\'lishi kerak',
      };
    }

    // OTP ni bazadan tekshirish (faqat kod bilan)
    // Database funksiyasi verify_otp(p_code text) telefon raqamni qaytaradi
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_otp', {
      p_code: code,
    });

    if (verifyError) {
      console.error('OTP verification error:', verifyError);
      return {
        success: false,
        error: 'Tekshirishda xatolik: ' + verifyError.message,
      };
    }

    // Database funksiyasi telefon raqamni qaytaradi yoki null
    if (verifyData && typeof verifyData === 'string') {
      return {
        success: true,
        message: 'Tasdiqlandi',
        phone: verifyData,
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
