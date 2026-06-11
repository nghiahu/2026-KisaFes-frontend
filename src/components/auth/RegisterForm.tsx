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

const registerSchema = z.object({
  fullName: z.string().min(2, 'fullname_short'),
  email: z.string().email('invalid_email'),
  password: z.string().min(8, 'password_short')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'password_weak'),
  agreeTerms: z.boolean().refine(val => val, 'must_agree')
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { loading, errorMsg, registerInit } = useAuthActions();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', agreeTerms: false }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    await registerInit(data);
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">{t('auth.register.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('auth.register.subtitle')}</p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-destructive/20 text-destructive text-sm rounded">{errorMsg}</div>}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-foreground">{t('auth.register.full_name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('auth.register.full_name_placeholder')} {...field} className={form.formState.errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""} />
                </FormControl>
                {form.formState.errors.fullName && (
                  <p className="text-destructive text-xs font-medium">{t(`auth.register.${form.formState.errors.fullName.message}`)}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-foreground">{t('auth.register.email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('auth.register.email_placeholder')} {...field} className={form.formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                </FormControl>
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs font-medium">{t(`auth.register.${form.formState.errors.email.message}`)}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-foreground">{t('auth.register.password')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pr-10 ${form.formState.errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...field}
                    />
                    <Button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? (<Icons.eyeOff size={18} />) : (<Icons.eye size={18} />)}
                    </Button>
                  </div>
                </FormControl>
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs font-medium">{t(`auth.register.${form.formState.errors.password.message}`)}</p>
                )}
              </FormItem>
            )}
          />

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" {...form.register('agreeTerms')} className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {t('auth.register.agree_terms')}{' '}
                <a href="#" className="text-primary hover:underline">
                  {t('auth.register.terms')}
                </a>
                {' '}{t('auth.register.and')}{' '}
                <a href="#" className="text-primary hover:underline">
                  {t('auth.register.privacy_policy')}
                </a>
              </span>
            </label>
            {form.formState.errors.agreeTerms && <p className="text-destructive text-xs mt-1 font-medium">{t(`auth.register.${form.formState.errors.agreeTerms.message}`)}</p>}
          </div>

          <Button
            type="submit"
            variant="kisafres"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? t('auth.register.creating_btn') : t('auth.register.create_btn')}
          </Button>
        </form>
      </Form>

      <div className="mt-4">
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-muted-foreground">{t('auth.login.or')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="text-xs font-medium" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}>
            <span>G</span>
            <span className="hidden sm:inline">Google</span>
          </Button>
          <Button variant="outline" className="text-xs font-medium" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/github'}>
            <span>⚫</span>
            <span className="hidden sm:inline">GitHub</span>
          </Button>
        </div>
      </div>

      <p className="mt-3 text-center text-muted-foreground text-xs">
        {t('auth.register.already_have_account')}{' '}
        <a href="/login" className="text-primary font-semibold hover:text-blue-700">
          {t('auth.register.log_in')}
        </a>
      </p>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <a href="#" className="hover:text-foreground">
          {t('auth.login.privacy')}
        </a>
        <span>•</span>
        <span>{t('auth.login.copyright')}</span>
      </div>
    </>
  );
}
