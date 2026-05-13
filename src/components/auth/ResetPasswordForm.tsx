import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuthActions } from '../../hooks/useAuthActions';
import { clearResetPasswordData } from '../../store/slices/authSlice';
import { Icons } from '../../assets/icons';
import { useState } from 'react';
import type { RootState } from '../../store';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain uppercase, lowercase, number and special char'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const resetData = useSelector((state: RootState) => state.auth.resetPasswordData);
  const { loading, errorMsg, resetPassword } = useAuthActions();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Redirect if missing data
  if (!resetData?.email || !resetData?.verifyToken) {
    navigate('/forgot-password');
    return null;
  }

  const onSubmit = async (data: ResetPasswordValues) => {
    const result = await resetPassword(
      resetData.email!,
      resetData.verifyToken!,
      data.newPassword
    );
    if (result) {
      setSuccess(true);
      dispatch(clearResetPasswordData());
      // Navigate to login after a short delay for UX
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  if (success) {
    return (
      <>
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password Reset Successfully</h2>
          <p className="text-sm text-gray-600">
            Your password has been changed. Redirecting to login...
          </p>
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-blue-600 rounded-full animate-[shrink_2s_linear_forwards]" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Create a new password for <span className="font-medium text-gray-800">{resetData.email}</span>
        </p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{errorMsg}</div>}

      <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('newPassword')}
              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            CONFIRM NEW PASSWORD
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition duration-200 mt-1"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-5 text-center text-gray-600 text-xs">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            dispatch(clearResetPasswordData());
            navigate('/login');
          }}
          className="text-blue-600 font-semibold hover:text-blue-700"
        >
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
