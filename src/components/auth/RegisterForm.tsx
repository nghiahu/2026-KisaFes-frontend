import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Icons } from '../../assets/icons';
import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    await registerInit(data);
  };

  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{t('auth.register.title')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('auth.register.subtitle')}</p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{errorMsg}</div>}

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {t('auth.register.full_name')}
          </label>
          <input
            type="text"
            placeholder={t('auth.register.full_name_placeholder')}
            {...register('fullName')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{t(`auth.register.${errors.fullName.message}`)}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {t('auth.register.email')}
          </label>
          <input
            type="email"
            placeholder={t('auth.register.email_placeholder')}
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{t(`auth.register.${errors.email.message}`)}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('auth.register.password')}</label>
          <div className="relative">
           <input type={showPassword ? "text" : "password"} placeholder="••••••••"
              {...register('password')}
              className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button type="button"onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPassword ? (<Icons.eyeOff size={18} />) : (<Icons.eye size={18} />)}
            </button>
          </div>
          {errors.password && (<p className="text-red-500 text-xs mt-1">{t(`auth.register.${errors.password.message}`)}</p>)}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('agreeTerms')} className="w-3 h-3 rounded border-gray-300" />
          <span className="text-xs text-gray-600">
            {t('auth.register.agree_terms')}{' '}
            <a href="#" className="text-blue-600 hover:underline">
              {t('auth.register.terms')}
            </a>
            {' '}{t('auth.register.and')}{' '}
            <a href="#" className="text-blue-600 hover:underline">
              {t('auth.register.privacy_policy')}
            </a>
          </span>
        </label>
        {errors.agreeTerms && <p className="text-red-500 text-xs">{t(`auth.register.${errors.agreeTerms.message}`)}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition duration-200 mt-1"
        >
          {loading ? t('auth.register.creating_btn') : t('auth.register.create_btn')}
        </button>
      </form>

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
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs font-medium text-gray-700" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}>
            <span>G</span>
            <span className="hidden sm:inline">Google</span>
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs font-medium text-gray-700" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/github'}>
            <span>⚫</span>
            <span className="hidden sm:inline">GitHub</span>
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-gray-600 text-xs">
        {t('auth.register.already_have_account')}{' '}
        <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
          {t('auth.register.log_in')}
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
