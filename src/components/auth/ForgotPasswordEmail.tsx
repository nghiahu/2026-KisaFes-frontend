import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuthActions } from '../../hooks/useAuthActions';
import { setResetPasswordData } from '../../store/slices/authSlice';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordEmail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, errorMsg, sendResetPasswordOtp } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormValues) => {
    const success = await sendResetPasswordOtp(data.email);
    if (success) {
      dispatch(setResetPasswordData({ email: data.email }));
      navigate('/forgot-password/otp');
    }
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter your email address and we'll send you a verification code.
        </p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{errorMsg}</div>}

      <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition duration-200 mt-1"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>

      <p className="mt-5 text-center text-gray-600 text-xs">
        Remember your password?{' '}
        <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
          Back to Login
        </a>
      </p>

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500">
        <a href="#" className="hover:text-gray-700">
          Privacy
        </a>
        <span>•</span>
        <span>© 2024 KisaFres</span>
      </div>
    </>
  );
}
