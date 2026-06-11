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
          <h2 className="text-2xl font-bold text-foreground">Password Reset Successfully</h2>
          <p className="text-sm text-muted-foreground">
            Your password has been changed. Redirecting to login...
          </p>
          <div className="w-full h-1 bg-accent rounded-full overflow-hidden mt-4">
            <div className="h-full bg-primary rounded-full animate-[shrink_2s_linear_forwards]" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new password for <span className="font-medium text-foreground">{resetData.email}</span>
        </p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-destructive/20 text-destructive text-sm rounded">{errorMsg}</div>}

      <Form {...form}>
        <form className="space-y-4 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-foreground">NEW PASSWORD</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pr-10 ${form.formState.errors.newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </Button>
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
                <FormLabel className="text-xs font-semibold text-foreground">CONFIRM NEW PASSWORD</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pr-10 ${form.formState.errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </Button>
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

      <p className="mt-5 text-center text-muted-foreground text-xs">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            dispatch(clearResetPasswordData());
            navigate('/login');
          }}
          className="text-primary font-semibold hover:text-primary/80"
        >
          Back to Login
        </a>
      </p>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <a href="#" className="hover:text-foreground">
          Privacy
        </a>
        <span>•</span>
        <span>© 2024 KisaFres</span>
      </div>
    </>
  );
}
