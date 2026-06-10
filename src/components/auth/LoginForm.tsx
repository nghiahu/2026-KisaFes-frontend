import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Icons } from '../../assets/icons';
import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  // We'll handle validation messages dynamically in the component using t()
  email: z.string().min(1, 'email_required'),
  password: z.string().min(1, 'password_required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { loading, errorMsg, loginUser } = useAuthActions();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const payload = {
        username: data.email,
        password: data.password
      };
      await loginUser(payload);
    } catch (err) {
      // Error is handled in the hook
    }
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{t('auth.login.title')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('auth.login.subtitle')}</p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{errorMsg}</div>}

      <Form {...form}>
        <form className="space-y-4 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">{t('auth.login.email_username')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('auth.login.email_username_placeholder')} autoComplete="username" {...field} className={form.formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                </FormControl>
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs font-medium">{t(`auth.login.${form.formState.errors.email.message}`)}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel className="text-xs font-semibold text-gray-700">{t('auth.login.password')}</FormLabel>
                  <a href="/forgot-password" className="text-xs text-primary hover:text-blue-700 font-semibold">
                    {t('auth.login.forgot_password')}
                  </a>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`pr-10 ${form.formState.errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors">
                      {showPassword ? (
                        <Icons.eyeOff size={18} />
                      ) : (
                        <Icons.eye size={18} />
                      )}
                    </button>
                  </div>
                </FormControl>
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs font-medium">{t(`auth.login.${form.formState.errors.password.message}`)}</p>
                )}
              </FormItem>
            )}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-xs font-medium text-gray-600">{t('auth.login.remember_me')}</span>
          </label>

          <Button
            type="submit"
            variant="kisafres"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? t('auth.login.logging_in_btn') : t('auth.login.login_btn')}
          </Button>
        </form>
      </Form>

      <div className="mt-4">
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">{t('auth.login.or')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="text-xs font-medium" onClick={() => { document.cookie = `oauth2_client_url=${window.location.origin}; path=/; max-age=300`; window.location.href = 'http://localhost:8080/oauth2/authorization/google'; }}>
            <span>G</span>
            <span className="hidden sm:inline">Google</span>
          </Button>
          <Button variant="outline" className="text-xs font-medium" onClick={() => { document.cookie = `oauth2_client_url=${window.location.origin}; path=/; max-age=300`; window.location.href = 'http://localhost:8080/oauth2/authorization/github'; }}>
            <span>⚫</span>
            <span className="hidden sm:inline">GitHub</span>
          </Button>
        </div>
      </div>

      <p className="mt-3 text-center text-gray-600 text-xs">
        {t('auth.login.no_account')}{' '}
        <a href="/signup" className="text-primary font-semibold hover:text-blue-700">
          {t('auth.login.sign_up')}
        </a>
      </p>

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500">
        <a href="#" className="hover:text-gray-700">
          {t('auth.login.privacy')}
        </a>
        <span>•</span>
        <span>{t('auth.login.copyright')}</span>
      </div>
    </>
  );
}
