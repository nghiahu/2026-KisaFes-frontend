import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuthActions } from '../../hooks/useAuthActions';
import { setResetPasswordData } from '../../store/slices/authSlice';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordEmail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, errorMsg, sendResetPasswordOtp } = useAuthActions();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
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

      <Form {...form}>
        <form className="space-y-4 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">EMAIL ADDRESS</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@company.com" {...field} className={form.formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                </FormControl>
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.email.message}</p>
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
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-gray-600 text-xs">
        Remember your password?{' '}
        <a href="/login" className="text-primary font-semibold hover:text-blue-700">
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
