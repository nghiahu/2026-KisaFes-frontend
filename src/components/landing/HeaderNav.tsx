import { useLanguage } from '../../contexts/LanguageContext';

export default function HeaderNav() {
  const { t } = useLanguage();
  return (
    <ul className="hidden lg:flex items-center gap-8">
      <li>
        <a href="#dashboards" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          {t('landing.nav.dashboards')}
        </a>
      </li>
      <li>
        <a href="#projects" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          {t('landing.nav.projects')}
        </a>
      </li>
      <li>
        <a href="#issues" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          {t('landing.nav.issues')}
        </a>
      </li>
      <li>
        <a href="#teams" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition duration-200">
          {t('landing.nav.teams')}
        </a>
      </li>
    </ul>
  )
}
