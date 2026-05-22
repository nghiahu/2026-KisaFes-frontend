import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Icons } from '../../assets/icons';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { loading, errorMsg, loginUser } = useAuthActions();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-600 mt-1">Enter your details to sign in.</p>
      </div>

      {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{errorMsg}</div>}

      <form className="space-y-3 mt-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            EMAIL / USERNAME
          </label>
          <input
            type="text"
            placeholder="name@company.com"
            autoComplete="username"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">PASSWORD</label>
            <a href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
              Forgot?
            </a>
          </div>
          <div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                autoComplete="current-password"
                {...register('password')}
                className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'}`}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? (
                  <Icons.eyeOff size={18} />
                ) : (
                  <Icons.eye size={18} />
                )}
              </button>
            </div>
            {errors.password && (<p className="text-red-500 text-xs mt-1">{errors.password.message}</p>)}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-3 h-3 rounded border-gray-300" />
          <span className="text-xs text-gray-600">Remember me</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition duration-200 mt-1"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">OR</span>
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
        Don't have an account?{' '}
        <a href="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign up
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
