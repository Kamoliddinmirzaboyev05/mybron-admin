import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyOTPCode, generateOTP } from '../../lib/smsService';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Step = 'otp' | 'profile';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('otp');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // OTP ni tekshirish
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
      // OTP ni tekshirish (faqat kod bilan)
      const result = await verifyOTPCode(code);

      if (!result.success || !result.phone) {
        setError(result.error || 'Noto\'g\'ri yoki muddati o\'tgan kod');
        setLoading(false);
        return;
      }

      // Check if user already exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone')
        .eq('phone', result.phone)
        .single();

      // If user already exists, redirect to login
      if (profileData && !profileError) {
        setLoading(false);
        toast.error('Sizda allaqachon hisob bor. Iltimos tizimga kiring');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      // New user - save phone and show profile form
      setPhone(result.phone);
      setStep('profile');
      setLoading(false);
      toast.success('Kod tasdiqlandi! Iltimos ma\'lumotlaringizni kiriting');

    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
      setLoading(false);
    }
  };

  // Profilni yaratish
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va familiyani kiriting');
      return;
    }

    setLoading(true);

    try {
      // Create admin account with persistent session
      const email = `${phone}@bron.uz`;
      const password = phone; // Use phone as password for simplicity

      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone,
            role: 'admin',
          },
        },
      });

      if (authError) {
        setError('Admin yaratishda xatolik: ' + authError.message);
        setLoading(false);
        return;
      }

      // Session is automatically created and persisted by Supabase
      toast.success('Admin hisobi yaratildi!');
      
      // Redirect to dashboard
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
            {step === 'otp' ? 'Ro\'yxatdan o\'tish' : 'Ma\'lumotlaringiz'}
          </h1>
          <p className="text-zinc-400">
            {step === 'otp' 
              ? 'Telegram botdan kelgan kodni kiriting' 
              : 'Ism va familiyangizni kiriting'}
          </p>
        </div>

        {step === 'otp' ? (
          // 1-qadam: OTP kodni kiriting
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200 mb-2">
                📱 Telegram botdan kod olish:
              </p>
              <ol className="text-xs text-blue-300 space-y-1 ml-4 list-decimal">
                <li>@MyBronRobot ga o'ting</li>
                <li>/start bosing</li>
                <li>Kontaktingizni yuboring</li>
                <li>6 raqamli kodni oling</li>
              </ol>
              <a 
                href="https://t.me/MyBronRobot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram botga o'tish
              </a>
            </div>

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
          </form>
        ) : (
          // 2-qadam: Profil ma'lumotlari
          <form onSubmit={handleCreateProfile} className="space-y-4">
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Ismingiz"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Familiya
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Familiyangiz"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                'Hisobni yaratish'
              )}
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
