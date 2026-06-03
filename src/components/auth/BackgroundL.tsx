import { Icons } from '../../assets/icons'
import { useLanguage } from '../../contexts/LanguageContext'

const MonitorUpIcon = Icons.monitorUp
const LockKeyIcon = Icons.lockKeyhole

export default function BackgroundL() {
    const isLogin = location.pathname === '/login'
    const { t } = useLanguage()

    return (
            <div className="hidden lg:flex bg-linear-to-br from-blue-700 to-blue-900 p-8 flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-10">
                  <img src="/public/logo_kisa.png" alt="KisaFres Logo" className="w-8 h-8" />
                  <span className="text-xl font-bold text-white">KisaFres</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    {isLogin
                      ? t('auth.background.title_login')
                      : t('auth.background.title_register')}
                  </h1>
                  <p className="text-sm text-blue-100">
                    {isLogin
                      ? t('auth.background.subtitle_login')
                      : t('auth.background.subtitle_register')}
                  </p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <MonitorUpIcon className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{t('auth.background.feature1_title')}</h3>
                      <p className="text-xs text-blue-100">{t('auth.background.feature1_desc')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <LockKeyIcon className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{t('auth.background.feature2_title')}</h3>
                      <p className="text-xs text-blue-100">{t('auth.background.feature2_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    )
}