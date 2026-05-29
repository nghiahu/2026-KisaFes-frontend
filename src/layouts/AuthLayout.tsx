import { useLocation } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm.tsx'
import RegisterForm from '../components/auth/RegisterForm.tsx'
import OtpForm from '../components/auth/OtpForm.tsx'
import ProfileUpdateForm from '../components/auth/ProfileUpdateForm.tsx'
import BackgroundL from '../components/auth/BackgroundL.tsx'
import ForgotPasswordEmail from '../components/auth/ForgotPasswordEmail.tsx'
import ForgotPasswordOtp from '../components/auth/ForgotPasswordOtp.tsx'
import ResetPasswordForm from '../components/auth/ResetPasswordForm.tsx'


export default function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isOtp = location.pathname === '/signup/otp'
  const isProfile = location.pathname === '/signup/profile'
  const isForgotPassword = location.pathname === '/forgot-password'
  const isForgotPasswordOtp = location.pathname === '/forgot-password/otp'
  const isForgotPasswordReset = location.pathname === '/forgot-password/reset'

  // OTP pages (signup & forgot password) use centered layout without side panel
  const isOtpPage = isOtp || isForgotPasswordOtp

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 via-blue-50 to-blue-100 flex items-center justify-center p-3">
      <div className={`w-full ${isOtpPage ? 'max-w-3xl' : 'max-w-4xl'}`}>
        {isOtpPage ? (
          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-8">
            <div className="w-full max-w-xl">
              {isOtp && <OtpForm />}
              {isForgotPasswordOtp && <ForgotPasswordOtp />}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-4 border-blue-500 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Blue Background with Features */}
              <BackgroundL />

              {/* Right Side - Form */}
              <div className="flex items-center justify-center p-6 sm:p-8 lg:p-8">
                <div className="w-full min-h-136">
                  {isLogin && <LoginForm />}
                  {location.pathname === '/signup' && <RegisterForm />}
                  {isProfile && <ProfileUpdateForm />}
                  {isForgotPassword && <ForgotPasswordEmail />}
                  {isForgotPasswordReset && <ResetPasswordForm />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
