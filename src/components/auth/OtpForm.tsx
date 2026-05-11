import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { authService } from "../../services/auth.service";
import { setRegistrationData } from "../../store/slices/authSlice";
import type { RootState } from "../../store";

export default function OtpForm() {
  const OTP_LENGTH = 6;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const email = useSelector((state: RootState) => state.auth.registrationData?.email);
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.verifyOtp(email!, otpValue);
      const verifyToken = res.data; // token is returned in data inside wrapper
      dispatch(setRegistrationData({ verifyToken }));
      navigate('/signup/profile');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.sendOtp(email!);
      setCountdown(120);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-[0_30px_60px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Verify OTP
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            We have sent a 6-digit code to {email}. Please check and enter it below.
          </p>
        </div>

        {errorMsg && <div className="mb-6 p-3 bg-red-100 text-red-600 text-sm rounded-lg">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-16 w-16 rounded-2xl border border-slate-300 bg-slate-50 text-center text-2xl font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <span>Didn't receive the code?</span>
            <button 
              type="button" 
              onClick={handleResend}
              disabled={countdown > 0 || loading}
              className={`font-semibold transition ${countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`}
            >
              Resend code
            </button>
            {countdown > 0 && <span className="text-slate-400">{formatTime(countdown)}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-blue-600 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Gặp sự cố? Liên hệ bộ phận hỗ trợ kỹ thuật.
        </div>
      </div>
    </div>
  );
}
