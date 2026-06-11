import { Icons } from "../../assets/icons"
import { useLanguage } from "../../contexts/LanguageContext"
export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-gray-300 py-16 px-4 border-t dark:border-border">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Kisafres</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {t('landing.footer.desc')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Share">
                <Icons.monitorUp className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Follow">
                <Icons.link className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('landing.footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.p_features')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.p_solutions')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.p_pricing')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.p_roadmap')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('landing.footer.resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.r_docs')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.r_api')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.r_community')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.r_support')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('landing.footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.c_about')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.c_careers')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.c_privacy')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">{t('landing.footer.c_terms')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('landing.footer.subscribe')}</h4>
            <p className="text-sm text-gray-400 mb-4">{t('landing.footer.sub_desc')}</p>
            <input
              type="email"
              placeholder={t('landing.footer.sub_placeholder')}
              className="w-full px-4 py-2 bg-muted dark:bg-slate-900 border border-transparent dark:border-border text-white placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>{t('landing.footer.copyright')}</p>
          <p>{t('landing.footer.status')}</p>
        </div>
      </div>
    </footer>
  )
}
