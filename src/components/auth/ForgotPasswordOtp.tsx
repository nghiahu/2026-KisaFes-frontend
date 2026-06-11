import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearResetPasswordData, setResetPasswordData } from "../../store/slices/authSlice";
import type { RootState } from "../../store";
import { useAuthActions } from "../../hooks/useAuthActions";
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordOtp() {
  const OTP_LENGTH = 6;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = useSelector((state: RootState) => state.auth.resetPasswordData?.email);
  const { loading, errorMsg, setErrorMsg, verifyResetPasswordOtp, sendResetPasswordOtp } = useAuthActions();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [countdown, setCountdown] = useState(120);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!tokenExpired) return;

    if (redirectCountdown <= 0) {
      dispatch(clearResetPasswordData());
      navigate('/forgot-password');
      return;
    }

    const timer = setTimeout(() => setRedirectCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [tokenExpired, redirectCountdown, dispatch, navigate]);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedData) return;

    const newOtp = [...otp];

    pastedData.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const focusIndex = Math.min(
      pastedData.length,
      OTP_LENGTH - 1
    );

    inputRefs.current[focusIndex]?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const pasted = value.slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      pasted.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
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
      setErrorMsg('Vui lòng nhập đủ 6 chữ số.');
      return;
    }

    try {
      const verifyToken = await verifyResetPasswordOtp(email!, otpValue);
      dispatch(setResetPasswordData({ verifyToken }));
      navigate('/forgot-password/reset');
    } catch {
      const expiredIndicators = ['expired', 'hết hạn', 'invalid or expired'];
      const isExpired = expiredIndicators.some((keyword) =>
        (errorMsg || '').toLowerCase().includes(keyword)
      );
      if (isExpired) {
        setTokenExpired(true);
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    const success = await sendResetPasswordOtp(email!);
    if (success) {
      setCountdown(120);
      setOtp(new Array(OTP_LENGTH).fill(""));
    }
  };

  return (
    <div className="w-full max-w-xl rounded-[32px] bg-background p-8 shadow-[0_30px_60px_rgba(15,23,42,0.12)] sm:p-10">
      {tokenExpired ? (
        <div className="space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive text-2xl font-semibold">
            !
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Mã đã hết hạn
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Mã xác thực của bạn đã hết hạn. Vui lòng thử lại.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-muted/50 p-5 text-left text-sm text-foreground">
            <p className="font-semibold text-foreground">Chuyển về nhập email sau:</p>
            <p className="mt-2 text-lg">{redirectCountdown} giây</p>
          </div>

          <Button
            type="button"
            variant="kisafres"
            onClick={() => {
              dispatch(clearResetPasswordData());
              navigate('/forgot-password');
            }}
            className="mt-4 w-full rounded-3xl py-6 text-base"
          >
            Quay về nhập email ngay
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Xác thực OTP
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Mã 6 chữ số đã được gửi đến <span className="font-medium text-foreground">{email}</span>. Vui lòng kiểm tra và nhập vào bên dưới.
            </p>
          </div>

          {errorMsg && <div className="mb-6 p-3 bg-destructive/20 text-destructive text-sm rounded-lg">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="h-16 w-16 rounded-2xl bg-muted/50 text-center text-2xl font-semibold text-foreground"
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Chưa nhận được mã?</span>
              <Button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className={`font-semibold transition ${countdown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:text-primary/80'}`}
              >
                Gửi lại mã
              </Button>
              {countdown > 0 && <span className="text-muted-foreground">{formatTime(countdown)}</span>}
            </div>

            <Button
              type="submit"
              variant="kisafres"
              disabled={loading}
              className="w-full rounded-3xl py-6 text-base flex items-center justify-center gap-2"
            >
              {loading ? 'Đang xác thực...' : 'Xác thực'}
              <span aria-hidden="true">→</span>
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <Button
              type="button"
              onClick={() => {
                dispatch(clearResetPasswordData());
                navigate('/login');
              }}
              className="text-primary hover:text-primary/80 font-semibold"
            >
              Quay về đăng nhập
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
