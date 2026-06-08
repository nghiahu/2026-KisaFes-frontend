import { useLanguage } from '../../contexts/LanguageContext';
import { Icons } from '../../assets/icons';

export default function HeaderNav() {
  const { t } = useLanguage();
  return (
    <ul className="hidden lg:flex items-center gap-6 xl:gap-8">
      {/* Features Dropdown */}
      <li className="relative group">
        <button className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 py-4">
          {t('landing.nav.features')}
          <Icons.chevronDown className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:rotate-180" />
        </button>
        {/* Dropdown Panel */}
        <div className="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 p-2">
          <ul className="flex flex-col">
            <li>
              <a href="#features" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                {t('landing.nav.dropdown.features.all')}
              </a>
            </li>
            <li>
              <a href="#rovo" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                {t('landing.nav.dropdown.features.rovo')}
              </a>
            </li>
          </ul>
        </div>
      </li>

      {/* Solutions Dropdown */}
      <li className="relative group">
        <button className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 py-4">
          {t('landing.nav.solutions')}
          <Icons.chevronDown className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:rotate-180" />
        </button>
        {/* Mega Menu Panel */}
        <div className="absolute top-full -left-24 xl:-left-40 w-[600px] bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 p-6 flex gap-8">
          {/* Column 1: Teams */}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              {t('landing.nav.dropdown.solutions.teams')}
            </h3>
            <ul className="flex flex-col gap-1">
              {['marketing', 'engineering', 'design', 'operations', 'it'].map((item) => (
                <li key={item}>
                  <a href={`#${item}`} className="block py-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                    {t(`landing.nav.dropdown.solutions.${item}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 2: Use Cases */}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              {t('landing.nav.dropdown.solutions.useCases')}
            </h3>
            <ul className="flex flex-col gap-1">
              {['gettingStarted', 'planning', 'campaign', 'agile', 'program'].map((item) => (
                <li key={item}>
                  <a href={`#${item}`} className="block py-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                    {t(`landing.nav.dropdown.solutions.${item}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company Size */}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              {t('landing.nav.dropdown.solutions.companySize')}
            </h3>
            <ul className="flex flex-col gap-1">
              <li>
                <a href="#enterprise" className="block py-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  {t('landing.nav.dropdown.solutions.enterprise')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </li>

      {/* Guide (No Dropdown) */}
      <li>
        <a href="#guide" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 py-4">
          {t('landing.nav.guide')}
        </a>
      </li>

      {/* Templates Dropdown */}
      <li className="relative group">
        <button className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 py-4">
          {t('landing.nav.templates')}
          <Icons.chevronDown className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:rotate-180" />
        </button>
        {/* Dropdown Panel */}
        <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 p-3">
          <ul className="flex flex-col gap-0.5">
            {['all', 'software', 'finance', 'marketing', 'design', 'sales', 'operations', 'service', 'hr', 'legal', 'itOps'].map((item) => (
              <li key={item}>
                {/* Fallback to solutions for generic names if template key is missing (like marketing/design/sales) */}
                <a href={`#template-${item}`} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                  {t(`landing.nav.dropdown.templates.${item}`, { defaultValue: t(`landing.nav.dropdown.solutions.${item}`) })}
                </a>
              </li>
            ))}
            <li className="my-2 border-t border-slate-100"></li>
            <li>
              <a href="#kisaService" className="block px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                {t('landing.nav.dropdown.templates.kisaService')}
              </a>
            </li>
          </ul>
        </div>
      </li>

      {/* Pricing (No Dropdown) */}
      <li>
        <a href="#pricing" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 py-4">
          {t('landing.nav.pricing')}
        </a>
      </li>
    </ul>
  )
}
