import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyOTPCode, generateOTP } from '../../lib/smsService';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
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

  const handleLogin = async (e: React.FormEvent) => {
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

      // Check if user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone')
        .eq('phone', result.phone)
        .single();

      // If user doesn't exist, redirect to register
      if (!profileData || profileError) {
        setLoading(false);
        toast.error('Hisobingiz topilmadi. Iltimos ro\'yxatdan o\'ting');
        setTimeout(() => {
          window.location.href = '/register';
        }, 1500);
        return;
      }

      // User exists - proceed with login and create persistent session
      const email = `${result.phone}@bron.uz`;
      const password = result.phone; // Use phone as password
      
      // Sign in with password to create a persistent session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, user might not exist in auth yet
        // This shouldn't happen if profile exists, but handle it
        setError('Tizimga kirishda xatolik. Iltimos qaytadan urinib ko\'ring');
        setLoading(false);
        return;
      }

      // Session is now created and persisted automatically by Supabase
      toast.success('Tizimga kirildi!');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

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
          <h1 className="text-2xl font-bold text-white mb-2">Tizimga kirish</h1>
          <p className="text-zinc-400">Telegram botdan kelgan kodni kiriting</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
                Kirish...
              </>
            ) : (
              'Kirish'
            )}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Hisobingiz yo'qmi?{' '}
          <button 
            onClick={() => window.location.href = '/register'} 
            className="text-blue-500 hover:text-blue-400 underline"
          >
            Ro'yxatdan o'tish
          </button>
        </p>
      </div>
    </div>
  );
}
