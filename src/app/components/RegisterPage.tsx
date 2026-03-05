import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyOTP, generateOTP } from '../../lib/smsService';
import { UserPlus, Loader2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Step = 'phone' | 'verify';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Telefon raqamni formatlash
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    
    if (digits.length === 0) return '';
    
    formatted = '+998';
    
    let remaining = digits;
    if (digits.startsWith('998')) {
      remaining = digits.slice(3);
    } else {
      remaining = digits;
    }
    
    if (remaining.length > 0) formatted += ' ' + remaining.slice(0, 2);
    if (remaining.length > 2) formatted += ' ' + remaining.slice(2, 5);
    if (remaining.length > 5) formatted += ' ' + remaining.slice(5, 7);
    if (remaining.length > 7) formatted += ' ' + remaining.slice(7, 9);
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setPhone(formatted);
  };

  // Telegram bot orqali kod olish
  const handleGetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validatsiya
    if (!name.trim()) {
      setError('Ismingizni kiriting');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
      setError('Telefon raqam to\'liq emas (12 raqam kerak)');
      return;
    }

    // Telegram botga yo'naltirish
    const botUrl = 'https://t.me/MyBronRobot';
    window.open(botUrl, '_blank');
    
    // Keyingi qadamga o'tish
    setStep('verify');
    toast.success('Telegram botga o\'ting va kontaktingizni yuboring');
  };

  // OTP input handling (42.uz stili)
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Faqat raqamlar

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Faqat oxirgi raqam
    setOtp(newOtp);

    // Avtomatik keyingi inputga o'tish
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Oxirgi to'ldirilgan inputga focus
    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    lastInput?.focus();
  };

  // OTP ni tekshirish va admin yaratish
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('6 raqamli kodni kiriting');
      return;
    }

    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '');

      // OTP ni tekshirish
      const result = await verifyOTP(phoneDigits, code);

      if (!result.success) {
        setError(result.error || 'Noto\'g\'ri yoki muddati o\'tgan kod');
        setLoading(false);
        return;
      }

      // Admin yaratish (Supabase Auth)
      const email = `${phoneDigits}@bron.uz`;
      const password = generateOTP() + generateOTP(); // 12 raqamli parol

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name.trim(),
            phone: phoneDigits,
            role: 'admin',
          },
        },
      });

      if (authError) {
        setError('Admin yaratishda xatolik: ' + authError.message);
        setLoading(false);
        return;
      }

      // Muvaffaqiyatli
      toast.success('Admin hisobi yaratildi!');
      
      // Dashboard ga yo'naltirish
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/bronlogo.png" 
              alt="Bron Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 'phone' ? 'Ro\'yxatdan o\'tish' : 'Kodni tasdiqlash'}
          </h1>
          <p className="text-zinc-400">
            {step === 'phone' 
              ? 'Admin hisobini yaratish' 
              : 'Telegram botdan kelgan kodni kiriting'}
          </p>
        </div>

        {step === 'phone' ? (
          // 1-qadam: Ism va telefon raqam
          <form onSubmit={handleGetCode} className="space-y-4">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Ism
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Ismingiz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Telefon raqami
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={17}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="+998 90 123 45 67"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Format: +998 XX XXX XX XX
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Telegram orqali kod olish
            </button>

            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                📱 Telegram botga o'tib, kontaktingizni yuboring. Bot sizga 6 raqamli kod yuboradi.
              </p>
            </div>
          </form>
        ) : (
          // 2-qadam: OTP tekshirish (42.uz stili)
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-4 text-center">
                Tasdiqlash kodi
              </label>
              
              {/* 42.uz stilidagi 6 ta input */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white text-center text-2xl font-bold focus:outline-none focus:border-blue-600 transition-colors"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Telegram botdan kelgan 6 raqamli kodni kiriting
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                'Tasdiqlash'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp(['', '', '', '', '', '']);
                setError('');
              }}
              className="w-full text-zinc-400 hover:text-zinc-300 font-medium py-2 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga
            </button>
          </form>
        )}

        <p className="text-center text-zinc-400 text-sm mt-6">
          Hisobingiz bormi?{' '}
          <button 
            onClick={() => window.location.href = '/login'} 
            className="text-blue-500 hover:text-blue-400 underline"
          >
            Tizimga kirish
          </button>
        </p>
      </div>
    </div>
  );
}
