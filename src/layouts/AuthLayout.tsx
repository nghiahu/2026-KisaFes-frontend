import { useLocation } from 'react-router-dom'
import { Icons } from '../assets/icons'
import LoginForm from '../components/auth/LoginForm.tsx'
import RegisterForm from '../components/auth/RegisterForm.tsx'
import OtpForm from '../components/auth/OtpForm.tsx'
import ProfileUpdateForm from '../components/auth/ProfileUpdateForm.tsx'

const MonitorUpIcon = Icons.monitorUp
const LockKeyIcon = Icons.lockKeyhole

export default function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isOtp = location.pathname === '/signup/otp'
  const isProfile = location.pathname === '/signup/profile'

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 via-blue-50 to-blue-100 flex items-center justify-center p-3">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl border-4 border-blue-500 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Blue Background with Features */}
            <div className="hidden lg:flex bg-linear-to-br from-blue-700 to-blue-900 p-8 flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-10">
                  <img src="/public/logo_kisa.png" alt="KisaFres Logo" className="w-8 h-8" />
                  <span className="text-xl font-bold text-white">KisaFres</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    {isLogin
                      ? "Streamline your team's velocity."
                      : "Elevate your team's efficiency."}
                  </h1>
                  <p className="text-sm text-blue-100">
                    {isLogin
                      ? "Manage backlogs, track sprints, and deploy faster."
                      : "Join teams managing complex workflows with precision."}
                  </p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <MonitorUpIcon className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Fast Sync</h3>
                      <p className="text-xs text-blue-100">Real-time collaboration.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <LockKeyIcon className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Enterprise Grade</h3>
                      <p className="text-xs text-blue-100">SOC2 compliance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 sm:p-8 lg:p-8">
              <div className="w-full min-h-136">
                {isLogin && <LoginForm />}
                {location.pathname === '/signup' && <RegisterForm />}
                {isOtp && <OtpForm />}
                {isProfile && <ProfileUpdateForm />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
