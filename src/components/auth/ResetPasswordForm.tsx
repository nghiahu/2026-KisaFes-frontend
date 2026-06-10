import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuthActions } from '../../hooks/useAuthActions';
import { clearResetPasswordData } from '../../store/slices/authSlice';
import { Icons } from '../../assets/icons';
import { useState, useEffect } from 'react';
import type { RootState } from '../../store';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  // Redirect if missing data
  useEffect(() => {
    if (!resetData?.email || !resetData?.verifyToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetData, navigate]);

  if (!resetData?.email || !resetData?.verifyToken) {
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
            <div className="h-full bg-primary rounded-full animate-[shrink_2s_linear_forwards]" />
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

      <Form {...form}>
        <form className="space-y-4 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">NEW PASSWORD</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pr-10 ${form.formState.errors.newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                {form.formState.errors.newPassword && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.newPassword.message}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">CONFIRM NEW PASSWORD</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pr-10 ${form.formState.errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirm ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                {form.formState.errors.confirmPassword && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.confirmPassword.message}</p>
                )}
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="kisafres"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-gray-600 text-xs">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            dispatch(clearResetPasswordData());
            navigate('/login');
          }}
          className="text-primary font-semibold hover:text-blue-700"
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
