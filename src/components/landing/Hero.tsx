import dashboardImage from "../../assets/dashboard.png";
import boardImage from "../../assets/board.png";
import reportImage from "../../assets/report.png"
import { useLanguage } from "../../contexts/LanguageContext"

export default function Hero() {
  const { t } = useLanguage()
  return (
    <section className="py-20 px-4">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">
                {t('landing.hero.badge')}
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                {t('landing.hero.title_1')} <span className="gradient-text">{t('landing.hero.title_work')}</span>{t('landing.hero.title_2')} <span className="text-orange-600">{t('landing.hero.title_tasks')}</span> {t('landing.hero.title_3')}
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
              {t('landing.hero.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition duration-200 shadow-md">
                {t('landing.hero.btn_start')}
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition duration-200">
                {t('landing.hero.btn_demo')}
              </button>
            </div>
            <p className="text-sm text-gray-500">{t('landing.hero.trusted_by')} <span className="font-semibold">QUANTUM • VERTEX • NEXUS</span></p>
          </div>
          <div className="relative animate-fade-in flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[680px]">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-200 via-white to-gray-200 shadow-2xl transform rotate-2 z-0" />

              <img
                src={boardImage}
                alt="Board preview"
                className="absolute left-[-16%] top-10 w-[42%] rounded-3xl border border-white/90 shadow-2xl object-cover rotate-[-12deg] scale-[0.94] z-10 animate-fan-left"
              />
              <img
                src={reportImage}
                alt="Report preview"
                className="absolute right-[-16%] top-28 w-[42%] rounded-3xl border border-white/90 shadow-2xl object-cover rotate-12 scale-[0.94] z-10 animate-fan-right"
              />

              <img
                src={dashboardImage}
                alt="Dashboard preview"
                className="relative w-full rounded-[2rem] shadow-2xl object-cover rotate-3 z-20 animate-fan-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
